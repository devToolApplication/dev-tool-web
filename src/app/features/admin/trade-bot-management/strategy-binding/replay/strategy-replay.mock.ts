import { BacktestJobResponse, BacktestMetricResponse, BacktestOrderResponse } from '../../../../../core/models/trade-bot/backtest.model';
import {
  ReplayOverlay,
  ReplayRuleExplanation,
  ReplayStep,
  ReplayStepEvent,
  ReplayTradeTimelineItem,
  StrategyReplayEventType,
  StrategyReplayPayload
} from '../../../../../core/models/trade-bot/strategy-replay.model';

const STEP_MS = 5 * 60 * 1000;

function normalizeTrade(order: BacktestOrderResponse, index: number): ReplayTradeTimelineItem {
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
    result: order.result === 'WIN' ? 'TP' : order.result === 'LOSS' ? 'SL' : order.result === 'BREAKEVEN' ? 'BE' : 'OPEN',
    rrAchieved:
      order.orderSide === 'BUY'
        ? Number(((order.exitPrice - order.entryPrice) / Math.max(order.entryPrice - order.stopLoss, 0.0000001)).toFixed(2))
        : Number(((order.entryPrice - order.exitPrice) / Math.max(order.stopLoss - order.entryPrice, 0.0000001)).toFixed(2)),
    entryReason: String(order.metadataJson?.['entryReason'] ?? 'Setup confirmed'),
    exitReason: order.exitReason ?? 'Replay exit',
    pnl: order.netPnl,
    activeFromStepIndex: 0,
    activeToStepIndex: 0
  };
}

function buildDefaultTrade(startTime: number): ReplayTradeTimelineItem {
  return {
    id: 'trade-1',
    index: 1,
    side: 'BUY',
    entryTime: startTime + 18 * STEP_MS,
    exitTime: startTime + 30 * STEP_MS,
    entryPrice: 2735.25,
    exitPrice: 2744.1,
    stopLoss: 2730.6,
    takeProfit: 2744.55,
    result: 'TP',
    rrAchieved: 1.9,
    entryReason: 'Retest candle reclaimed breakout level',
    exitReason: 'Take profit reached',
    pnl: 189,
    activeFromStepIndex: 18,
    activeToStepIndex: 30
  };
}

function buildRuleSet(stepIndex: number, trade: ReplayTradeTimelineItem): ReplayRuleExplanation[] {
  const setupLive = stepIndex >= Math.max(0, trade.activeFromStepIndex - 3);
  return [
    {
      key: 'session',
      label: 'New York session',
      status: stepIndex <= 48 ? 'PASS' : 'FAIL',
      message: stepIndex <= 48 ? 'Replay candle is inside the active session window.' : 'Session filter is no longer valid.'
    },
    {
      key: 'setup',
      label: 'Setup formed',
      status: setupLive ? 'PASS' : 'FAIL',
      message: setupLive ? 'The base structure needed for the strategy is available.' : 'Waiting for base structure.'
    },
    {
      key: 'entry',
      label: 'Entry trigger',
      status: stepIndex === trade.activeFromStepIndex ? 'PASS' : stepIndex > trade.activeFromStepIndex ? 'NEUTRAL' : 'FAIL',
      message: stepIndex === trade.activeFromStepIndex ? 'Entry executed on the next candle open.' : 'Trigger not active on this step.'
    }
  ];
}

function buildEvents(trades: ReplayTradeTimelineItem[], startTime: number): ReplayStepEvent[] {
  const baseEvents: ReplayStepEvent[] = [
    {
      id: 'session-started',
      type: 'session-started',
      stepIndex: 0,
      candleTime: startTime,
      title: 'Session started',
      message: 'Replay started from the first candle of the selected date.'
    }
  ];

  const tradeEvents = trades.flatMap((trade) => {
    const setupIndex = Math.max(1, trade.activeFromStepIndex - 3);
    const confirmIndex = Math.max(1, trade.activeFromStepIndex - 1);
    const exitIndex = trade.activeToStepIndex ?? trade.activeFromStepIndex;
    const exitType: StrategyReplayEventType = trade.result === 'TP' ? 'tp-hit' : trade.result === 'SL' ? 'sl-hit' : 'trade-closed';

    return [
      {
        id: `${trade.id}-setup`,
        type: 'setup-formed',
        stepIndex: setupIndex,
        candleTime: startTime + setupIndex * STEP_MS,
        title: 'Setup formed',
        message: trade.entryReason,
        tradeId: trade.id
      },
      {
        id: `${trade.id}-match`,
        type: 'condition-matched',
        stepIndex: confirmIndex,
        candleTime: startTime + confirmIndex * STEP_MS,
        title: 'Condition matched',
        message: 'All entry conditions are satisfied for the next candle.',
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
        candleTime: trade.exitTime ?? startTime + exitIndex * STEP_MS,
        title: trade.result === 'TP' ? 'Take profit hit' : trade.result === 'SL' ? 'Stop loss hit' : 'Trade closed',
        message: trade.exitReason,
        tradeId: trade.id
      },
      {
        id: `${trade.id}-closed`,
        type: 'trade-closed',
        stepIndex: exitIndex,
        candleTime: trade.exitTime ?? startTime + exitIndex * STEP_MS,
        title: 'Trade closed',
        message: trade.exitReason,
        tradeId: trade.id
      }
    ] as ReplayStepEvent[];
  });

  const sessionEndedEvent: ReplayStepEvent = {
    id: 'session-ended',
    type: 'session-ended',
    stepIndex: 59,
    candleTime: startTime + 59 * STEP_MS,
    title: 'Session ended',
    message: 'Replay session window has closed.'
  };

  return [
    ...baseEvents,
    ...tradeEvents,
    sessionEndedEvent
  ].sort((left, right) => left.stepIndex - right.stepIndex);
}

function buildOverlays(trades: ReplayTradeTimelineItem[], startTime: number): ReplayOverlay[] {
  const firstTrade = trades[0];
  if (!firstTrade) {
    return [];
  }

  return [
    {
      id: 'session-zone-1',
      type: 'session-zone',
      label: 'New York',
      visibleFromStepIndex: 0,
      visibleToStepIndex: 48,
      payload: {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(startTime + 48 * STEP_MS).toISOString(),
        high: firstTrade.takeProfit + 3,
        low: firstTrade.stopLoss - 3,
        color: 'var(--app-chart-primary-fill)'
      }
    },
    {
      id: 'entry-line-1',
      type: 'entry',
      label: 'Entry',
      visibleFromStepIndex: firstTrade.activeFromStepIndex,
      visibleToStepIndex: firstTrade.activeToStepIndex,
      payload: {
        startTime: new Date(firstTrade.entryTime).toISOString(),
        endTime: new Date(firstTrade.exitTime ?? firstTrade.entryTime).toISOString(),
        start: firstTrade.entryPrice,
        end: firstTrade.entryPrice,
        color: 'var(--app-chart-primary)'
      }
    },
    {
      id: 'sl-line-1',
      type: 'stop-loss',
      label: 'Stop loss',
      visibleFromStepIndex: firstTrade.activeFromStepIndex,
      visibleToStepIndex: firstTrade.activeToStepIndex,
      payload: {
        startTime: new Date(firstTrade.entryTime).toISOString(),
        endTime: new Date(firstTrade.exitTime ?? firstTrade.entryTime).toISOString(),
        start: firstTrade.stopLoss,
        end: firstTrade.stopLoss,
        color: 'var(--app-chart-danger)'
      }
    },
    {
      id: 'tp-line-1',
      type: 'take-profit',
      label: 'Take profit',
      visibleFromStepIndex: firstTrade.activeFromStepIndex,
      visibleToStepIndex: firstTrade.activeToStepIndex,
      payload: {
        startTime: new Date(firstTrade.entryTime).toISOString(),
        endTime: new Date(firstTrade.exitTime ?? firstTrade.entryTime).toISOString(),
        start: firstTrade.takeProfit,
        end: firstTrade.takeProfit,
        color: 'var(--app-chart-success)'
      }
    },
    {
      id: 'fvg-zone-1',
      type: 'fvg',
      label: 'FVG zone',
      visibleFromStepIndex: Math.max(0, firstTrade.activeFromStepIndex - 2),
      visibleToStepIndex: firstTrade.activeFromStepIndex + 3,
      payload: {
        startTime: new Date(firstTrade.entryTime - 2 * STEP_MS).toISOString(),
        endTime: new Date(firstTrade.entryTime + 3 * STEP_MS).toISOString(),
        high: firstTrade.entryPrice + 0.6,
        low: firstTrade.entryPrice - 0.4,
        color: 'var(--app-chart-warning-fill)'
      }
    }
  ];
}

export function buildMockReplayPayload(
  job: BacktestJobResponse,
  orders: BacktestOrderResponse[] = [],
  metric?: BacktestMetricResponse | null
): StrategyReplayPayload {
  const startTime = orders[0]?.entryTime ? orders[0].entryTime - 18 * STEP_MS : new Date(`${job.fromDate}T09:30:00Z`).getTime();
  const trades = (orders.length > 0 ? orders : []).map(normalizeTrade);
  const normalizedTrades = trades.length > 0 ? trades : [buildDefaultTrade(startTime)];

  normalizedTrades.forEach((trade) => {
    trade.activeFromStepIndex = Math.max(0, Math.round((trade.entryTime - startTime) / STEP_MS));
    trade.activeToStepIndex = trade.exitTime ? Math.max(trade.activeFromStepIndex, Math.round((trade.exitTime - startTime) / STEP_MS)) : trade.activeFromStepIndex + 4;
  });

  const steps: ReplayStep[] = Array.from({ length: 60 }, (_, index) => {
    const trade = normalizedTrades.find((item) => index >= item.activeFromStepIndex && index <= (item.activeToStepIndex ?? item.activeFromStepIndex)) ?? normalizedTrades[0];
    const anchor = 2730 + Math.sin(index / 4) * 4 + index * 0.12;
    const bias = metric?.pnl && metric.pnl > 0 ? 0.45 : -0.15;
    const open = Number((anchor + bias).toFixed(2));
    const close = Number((anchor + Math.sin(index / 2) * 0.7).toFixed(2));
    const high = Number((Math.max(open, close) + 0.9 + (index % 3) * 0.1).toFixed(2));
    const low = Number((Math.min(open, close) - 0.8 - (index % 2) * 0.08).toFixed(2));
    const candleTime = startTime + index * STEP_MS;

    return {
      index,
      candleTime,
      candle: {
        time: new Date(candleTime).toISOString(),
        open,
        high,
        low,
        close,
        volume: 100 + index * 8
      },
      ruleExplanations: buildRuleSet(index, trade),
      shortEvents: [],
      eventIds: [],
      activeTradeIds: normalizedTrades
        .filter((item) => index >= item.activeFromStepIndex && index <= (item.activeToStepIndex ?? item.activeFromStepIndex))
        .map((item) => item.id)
    };
  });

  const events = buildEvents(normalizedTrades, startTime);
  const overlays = buildOverlays(normalizedTrades, startTime);

  steps.forEach((step) => {
    const stepEvents = events.filter((event) => event.stepIndex === step.index);
    step.eventIds = stepEvents.map((event) => event.id);
    step.shortEvents = stepEvents.map((event) => event.title);
  });

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
