import { BacktestJobResponse, BacktestMetricResponse, BacktestOrderResponse } from '../../../../../core/models/trade-bot/backtest.model';
import { TradeBotCandleResponse } from '../../../../../core/models/trade-bot/chart-query.model';
import {
  ReplayOverlay,
  ReplayRuleExplanation,
  ReplayStep,
  ReplayStepEvent,
  ReplayTradeTimelineItem,
  StrategyReplayEventType,
  StrategyReplayPayload
} from '../../../../../core/models/trade-bot/strategy-replay.model';

function normalizeTrade(order: BacktestOrderResponse, index: number, stepByTime: Map<number, number>): ReplayTradeTimelineItem {
  const entryStepIndex = resolveStepIndex(stepByTime, order.entryTime);
  const exitStepIndex = resolveStepIndex(stepByTime, order.exitTime ?? order.entryTime, entryStepIndex);

  return {
    id: order.id,
    index: index + 1,
    side: order.orderSide,
    entryTime: order.entryTime,
    exitTime: order.exitTime,
    entryPrice: order.entryPrice,
    exitPrice: order.exitPrice,
    stopLoss: order.stopLoss,
    takeProfit: order.takeProfit,
    rawEntryPrice: Number(order.metadataJson?.['rawEntryPrice'] ?? order.entryPrice),
    rawExitPrice: Number(order.metadataJson?.['rawExitPrice'] ?? order.exitPrice),
    quantity: order.quantity,
    riskAmount: order.riskAmount,
    grossPnl: order.grossPnl,
    feePaid: order.feePaid,
    slippagePaid: order.slippagePaid,
    tradingCost: Number(((order.feePaid ?? 0) + (order.slippagePaid ?? 0)).toFixed(8)),
    result: order.result === 'WIN' ? 'TP' : order.result === 'LOSS' ? 'SL' : order.result === 'BREAKEVEN' ? 'BE' : 'OPEN',
    rrAchieved:
      order.orderSide === 'BUY'
        ? Number(((order.exitPrice - order.entryPrice) / Math.max(order.entryPrice - order.stopLoss, 0.0000001)).toFixed(2))
        : Number(((order.entryPrice - order.exitPrice) / Math.max(order.stopLoss - order.entryPrice, 0.0000001)).toFixed(2)),
    entryReason: String(order.metadataJson?.['entryReason'] ?? 'Setup confirmed'),
    exitReason: order.exitReason ?? 'Replay exit',
    pnl: order.netPnl,
    activeFromStepIndex: entryStepIndex,
    activeToStepIndex: exitStepIndex
  };
}

function resolveStepIndex(stepByTime: Map<number, number>, targetTime?: number, fallback = 0): number {
  if (targetTime == null) {
    return fallback;
  }
  if (stepByTime.has(targetTime)) {
    return stepByTime.get(targetTime) ?? fallback;
  }

  let resolved = fallback;
  for (const [time, stepIndex] of stepByTime.entries()) {
    if (time <= targetTime) {
      resolved = stepIndex;
      continue;
    }
    return stepIndex;
  }

  return resolved;
}

function buildRuleSet(stepIndex: number, trade?: ReplayTradeTimelineItem): ReplayRuleExplanation[] {
  const setupIndex = trade ? Math.max(0, trade.activeFromStepIndex - 1) : Number.MAX_SAFE_INTEGER;
  return [
    {
      key: 'chart-data',
      label: 'Chart data loaded',
      status: 'PASS',
      message: 'Replay step is built from chart-data snapshot.'
    },
    {
      key: 'setup',
      label: 'Setup formed',
      status: stepIndex >= setupIndex ? 'PASS' : 'NEUTRAL',
      message: stepIndex >= setupIndex ? trade?.entryReason ?? 'Setup context available.' : 'Waiting for setup context.'
    },
    {
      key: 'entry',
      label: 'Entry trigger',
      status: trade && stepIndex === trade.activeFromStepIndex ? 'PASS' : trade && stepIndex > trade.activeFromStepIndex ? 'NEUTRAL' : 'FAIL',
      message: trade && stepIndex === trade.activeFromStepIndex ? 'Order executed on this candle.' : 'No entry on this step.'
    }
  ];
}

function buildEvents(trades: ReplayTradeTimelineItem[], steps: ReplayStep[]): ReplayStepEvent[] {
  if (steps.length === 0) {
    return [];
  }

  const events: ReplayStepEvent[] = [
    {
      id: 'session-started',
      type: 'session-started',
      stepIndex: 0,
      candleTime: steps[0].candleTime,
      title: 'Session started',
      message: 'Replay started from chart data.'
    }
  ];

  trades.forEach((trade) => {
    const setupIndex = Math.max(0, trade.activeFromStepIndex - 1);
    const exitIndex = trade.activeToStepIndex ?? trade.activeFromStepIndex;
    const exitType: StrategyReplayEventType = trade.result === 'TP' ? 'tp-hit' : trade.result === 'SL' ? 'sl-hit' : 'trade-closed';

    events.push(
      {
        id: `${trade.id}-setup`,
        type: 'setup-formed',
        stepIndex: setupIndex,
        candleTime: steps[setupIndex]?.candleTime ?? trade.entryTime,
        title: 'Setup formed',
        message: trade.entryReason,
        tradeId: trade.id
      },
      {
        id: `${trade.id}-entry`,
        type: 'order-placed',
        stepIndex: trade.activeFromStepIndex,
        candleTime: trade.entryTime,
        title: 'Order placed',
        message: `${trade.side} entry at ${trade.entryPrice}`,
        tradeId: trade.id
      },
      {
        id: `${trade.id}-exit`,
        type: exitType,
        stepIndex: exitIndex,
        candleTime: trade.exitTime ?? steps[exitIndex]?.candleTime ?? trade.entryTime,
        title: trade.result === 'TP' ? 'Take profit hit' : trade.result === 'SL' ? 'Stop loss hit' : 'Trade closed',
        message: trade.exitReason,
        tradeId: trade.id
      }
    );
  });

  events.push({
    id: 'session-ended',
    type: 'session-ended',
    stepIndex: steps.length - 1,
    candleTime: steps[steps.length - 1].candleTime,
    title: 'Session ended',
    message: 'Replay reached the last available candle.'
  });

  return events.sort((left, right) => left.stepIndex - right.stepIndex || left.candleTime - right.candleTime);
}

function buildOverlays(trades: ReplayTradeTimelineItem[]): ReplayOverlay[] {
  return trades.flatMap((trade) => {
    const startTime = new Date(trade.entryTime).toISOString();
    const endTime = new Date(trade.exitTime ?? trade.entryTime).toISOString();

    return [
      {
        id: `entry-${trade.id}`,
        type: 'entry',
        label: `Entry ${trade.index}`,
        visibleFromStepIndex: trade.activeFromStepIndex,
        visibleToStepIndex: trade.activeToStepIndex,
        payload: {
          startTime,
          endTime,
          start: trade.entryPrice,
          end: trade.entryPrice,
          color: 'var(--app-chart-primary)'
        }
      },
      {
        id: `sl-${trade.id}`,
        type: 'stop-loss',
        label: `SL ${trade.index}`,
        visibleFromStepIndex: trade.activeFromStepIndex,
        visibleToStepIndex: trade.activeToStepIndex,
        payload: {
          startTime,
          endTime,
          start: trade.stopLoss,
          end: trade.stopLoss,
          color: 'var(--app-chart-danger)'
        }
      },
      {
        id: `tp-${trade.id}`,
        type: 'take-profit',
        label: `TP ${trade.index}`,
        visibleFromStepIndex: trade.activeFromStepIndex,
        visibleToStepIndex: trade.activeToStepIndex,
        payload: {
          startTime,
          endTime,
          start: trade.takeProfit,
          end: trade.takeProfit,
          color: 'var(--app-chart-success)'
        }
      }
    ];
  });
}

export function buildChartReplayPayload(
  job: BacktestJobResponse,
  chartData: TradeBotCandleResponse,
  orders: BacktestOrderResponse[] = [],
  _metric?: BacktestMetricResponse | null
): StrategyReplayPayload {
  const candles = (chartData.candlestickData ?? []).slice().sort((left, right) => left.utcTimeStamp - right.utcTimeStamp);
  const stepByTime = new Map<number, number>();

  const steps: ReplayStep[] = candles.map((candle, index) => {
    stepByTime.set(candle.utcTimeStamp, index);
    return {
      index,
      candleTime: candle.utcTimeStamp,
      candle: {
        time: new Date(candle.utcTimeStamp).toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      },
      ruleExplanations: [],
      shortEvents: [],
      eventIds: [],
      activeTradeIds: []
    };
  });

  const normalizedTrades = orders.map((order, index) => normalizeTrade(order, index, stepByTime));

  steps.forEach((step) => {
    step.activeTradeIds = normalizedTrades
      .filter((trade) => step.index >= trade.activeFromStepIndex && step.index <= (trade.activeToStepIndex ?? trade.activeFromStepIndex))
      .map((trade) => trade.id);
    const activeTrade = normalizedTrades.find((trade) => step.activeTradeIds.includes(trade.id));
    step.ruleExplanations = buildRuleSet(step.index, activeTrade);
  });

  const events = buildEvents(normalizedTrades, steps);
  const overlays = buildOverlays(normalizedTrades);

  steps.forEach((step) => {
    const stepEvents = events.filter((event) => event.stepIndex === step.index);
    step.eventIds = stepEvents.map((event) => event.id);
    step.shortEvents = stepEvents.map((event) => event.title);
  });

  if (steps.length === 0) {
    return {
      jobId: job.id,
      strategyServiceName: job.strategyServiceName,
      symbolCode: job.symbolCode,
      exchangeCode: job.exchangeCode,
      steps: [],
      events: [],
      trades: normalizedTrades,
      overlays: []
    };
  }

  return {
    jobId: job.id,
    strategyServiceName: job.strategyServiceName,
    symbolCode: job.symbolCode,
    exchangeCode: job.exchangeCode,
    steps,
    events,
    trades: normalizedTrades,
    overlays
  };
}
