export type RealtimeTaskType =
  | 'MARKET_DATA_SYNC'
  | 'MARKET_DATA_BACKFILL'
  | 'MARKET_DATA_REPAIR_GAP'
  | 'BACKTEST'
  | 'PAPER_TRADE_SESSION'
  | 'PAPER_TRADE_ORDER_UPDATE'
  | 'PAPER_TRADE_POSITION_UPDATE'
  | 'PAPER_TRADE_EQUITY_UPDATE'
  | 'PAPER_TRADE_SIGNAL_UPDATE'
  | 'PAPER_TRADE_ERROR'
  | 'SANDBOX'
  | 'JOB_EXECUTION'
  | 'REPLAY';

export type RealtimeTaskStatus =
  | 'IDLE'
  | 'STARTED'
  | 'RUNNING'
  | 'PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'FAILED'
  | 'CANCELLED'
  | 'WARNING'
  | 'PAUSED'
  | 'RESUMED';

export interface RealtimeProgressEvent {
  eventId: string;
  taskId: string;
  taskType: RealtimeTaskType;
  status: RealtimeTaskStatus;
  progressPercent?: number;
  current?: number;
  total?: number;
  step?: string;
  message?: string;
  errorCode?: string;
  traceId?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

export interface RealtimeCommand {
  commandId: string;
  commandType: string;
  taskType: RealtimeTaskType;
  taskId: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface TaskProgressState {
  taskId: string;
  taskType: RealtimeTaskType;
  status: RealtimeTaskStatus;
  progressPercent?: number;
  step?: string;
  message?: string;
  errorCode?: string;
  traceId?: string;
  current?: number;
  total?: number;
  payload?: Record<string, unknown>;
}
