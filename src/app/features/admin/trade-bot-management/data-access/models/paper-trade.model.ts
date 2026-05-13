export type PaperTradeAccountStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type PaperTradeSessionStatus = 'CREATED' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'FAILED';
export type PaperTradeTriggerType = 'MANUAL' | 'SCHEDULED' | 'REALTIME';
export type PaperTradeSide = 'BUY' | 'SELL';
export type PaperTradeOrderStatus = 'FILLED' | 'REJECTED';
export type PaperTradeOrderType = 'ENTRY' | 'EXIT';
export type PaperTradePositionStatus = 'OPEN' | 'CLOSED';

export interface CreatePaperTradeAccountRequest {
  name: string;
  description?: string;
  baseCurrency?: string;
  initialBalance: number;
  createdBy?: string;
}

export interface UpdatePaperTradeAccountRequest {
  name?: string;
  description?: string;
  currentBalance?: number;
}

export interface StartPaperTradeSessionRequest {
  accountId: string;
  strategyCode: string;
  symbol: string;
  interval: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  triggerType?: PaperTradeTriggerType;
  riskPerTradePct?: number;
  feeRate?: number;
  slippageRate?: number;
  maxPositionValuePct?: number;
  executorVersion?: string;
  createdBy?: string;
  executionConfig?: Record<string, unknown>;
  riskConfig?: Record<string, unknown>;
}

export interface PaperTradeAccount {
  id: string;
  name: string;
  description?: string;
  baseCurrency: string;
  initialBalance: number;
  currentBalance: number;
  availableBalance: number;
  lockedBalance: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  status: PaperTradeAccountStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaperTradeSession {
  id: string;
  sessionId: string;
  accountId: string;
  strategyConfigId?: string;
  strategyCode: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  symbol: string;
  interval: string;
  status: PaperTradeSessionStatus;
  triggerType: PaperTradeTriggerType;
  startedAt?: string;
  pausedAt?: string;
  stoppedAt?: string;
  failedAt?: string;
  lastEvaluatedBarTime?: string;
  lastSignalTime?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  executorVersion?: string;
  configSnapshotId?: string;
  marketDataSnapshotId?: string;
  progressTopic?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaperTradeSummary {
  sessionId: string;
  balance: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  openPositions: number;
  ordersCount: number;
  fillsCount: number;
  eventsCount: number;
  sessionStatus: PaperTradeSessionStatus;
  lastEvaluatedBar?: string;
  lastSignalTime?: string;
  lastSignal?: Record<string, unknown>;
}

export interface PaperTradeSnapshot {
  id: string;
  snapshotId: string;
  sessionId: string;
  strategyConfigId?: string;
  strategyConfigVersion?: string;
  strategyConfigHash?: string;
  strategyConfigSnapshot?: Record<string, unknown>;
  executionConfigSnapshot?: Record<string, unknown>;
  riskConfigSnapshot?: Record<string, unknown>;
  marketContextSnapshot?: Record<string, unknown>;
  executorVersion?: string;
  runtimeVersion?: string;
  configChangedAfterStart?: boolean;
  snapshotCreatedAt?: string;
}

export interface PaperTradeSessionDetail {
  session: PaperTradeSession;
  account: PaperTradeAccount;
  summary: PaperTradeSummary;
  snapshot?: PaperTradeSnapshot;
}

export interface PaperTradeControl {
  sessionId: string;
  status: PaperTradeSessionStatus;
  message: string;
  progressTopic?: string;
}

export interface PaperTradeOrder {
  id: string;
  orderId: string;
  sessionId: string;
  symbol: string;
  interval: string;
  side: PaperTradeSide;
  orderType: PaperTradeOrderType;
  status: PaperTradeOrderStatus;
  requestedPrice: number;
  filledPrice: number;
  quantity: number;
  remainingQuantity: number;
  filledAt?: string;
  signalId?: string;
}

export interface PaperTradeFill {
  id: string;
  fillId: string;
  orderId: string;
  sessionId: string;
  symbol: string;
  side: PaperTradeSide;
  price: number;
  quantity: number;
  fee: number;
  slippage: number;
  filledAt?: string;
}

export interface PaperTradePosition {
  id: string;
  positionId: string;
  sessionId: string;
  symbol: string;
  side: PaperTradeSide;
  status: PaperTradePositionStatus;
  quantity: number;
  entryPrice: number;
  markPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  openedAt?: string;
}

export interface PaperTradeEquityPoint {
  id: string;
  sessionId: string;
  time: string;
  balance: number;
  equity: number;
  availableBalance: number;
  lockedBalance: number;
  realizedPnl: number;
  unrealizedPnl: number;
  drawdown: number;
}

export interface PaperTradeEvent {
  id: string;
  eventId: string;
  sessionId: string;
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
  eventTime?: string;
  traceId?: string;
}
