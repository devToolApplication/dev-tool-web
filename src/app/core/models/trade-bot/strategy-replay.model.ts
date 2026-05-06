export type StrategyReplayEventType =
  | 'setup-formed'
  | 'condition-matched'
  | 'order-placed'
  | 'sl-hit'
  | 'tp-hit'
  | 'trade-closed'
  | 'session-started'
  | 'session-ended'
  | 'rule-pass'
  | 'rule-fail';

export type StrategyReplayOverlayType =
  | 'session-zone'
  | 'entry'
  | 'stop-loss'
  | 'take-profit'
  | 'trade-lifecycle'
  | 'area-zone'
  | 'indicator-line'
  | 'liquidity'
  | 'bos'
  | 'choch'
  | 'order-block'
  | 'fvg';

export interface ReplayRuleExplanation {
  key: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NEUTRAL';
  message?: string;
}

export interface ReplayStepEvent {
  id: string;
  type: StrategyReplayEventType;
  stepIndex: number;
  candleTime: number;
  title: string;
  message?: string;
  tradeId?: string;
  metadata?: Record<string, unknown>;
}

export interface ReplayTradeTimelineItem {
  id: string;
  index: number;
  side: 'BUY' | 'SELL';
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  rawEntryPrice?: number;
  rawExitPrice?: number;
  quantity?: number;
  riskAmount?: number;
  grossPnl?: number;
  feePaid?: number;
  slippagePaid?: number;
  tradingCost?: number;
  result: 'TP' | 'SL' | 'BE' | 'OPEN';
  rrAchieved?: number;
  entryReason?: string;
  exitReason?: string;
  pnl?: number;
  activeFromStepIndex: number;
  activeToStepIndex?: number;
}

export interface ReplayOverlay {
  id: string;
  type: StrategyReplayOverlayType;
  label: string;
  visibleFromStepIndex: number;
  visibleToStepIndex?: number;
  payload: Record<string, unknown>;
}

export interface ReplayStep {
  index: number;
  candleTime: number;
  candle: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  };
  ruleExplanations: ReplayRuleExplanation[];
  shortEvents: string[];
  eventIds: string[];
  activeTradeIds: string[];
}

export interface StrategyReplayPayload {
  jobId: string;
  strategyServiceName: string;
  symbolCode: string;
  exchangeCode: string;
  steps: ReplayStep[];
  events: ReplayStepEvent[];
  trades: ReplayTradeTimelineItem[];
  overlays: ReplayOverlay[];
}
