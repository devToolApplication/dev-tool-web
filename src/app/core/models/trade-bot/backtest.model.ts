import { TradeSideMode } from './trade-strategy-binding.model';

export interface BacktestRunDto {
  bindingId: string;
  exchangeId: string;
  symbolId: string;
  strategyId: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  feeRate: number;
  slippageRate: number;
  riskConfig: Record<string, unknown>;
}

export interface BacktestJobResponse {
  id: string;
  bindingId: string;
  exchangeId: string;
  exchangeCode: string;
  symbolId: string;
  symbolCode: string;
  providerSymbol: string;
  strategyId: string;
  strategyServiceName: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  fromDate: string;
  toDate: string;
  initialBalance: number;
  feeRate: number;
  slippageRate: number;
  riskConfig?: Record<string, unknown>;
  configJson?: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  totalTrades?: number;
  finalEquity?: number;
  pnl?: number;
}

export interface BacktestOrderResponse {
  id: string;
  backtestJobId: string;
  bindingId: string;
  exchangeId: string;
  exchangeCode: string;
  symbolId: string;
  symbolCode: string;
  providerSymbol: string;
  strategyId: string;
  strategyServiceName: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  nyTradeDate: string;
  orderSide: 'BUY' | 'SELL';
  entryTime: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  riskAmount: number;
  exitTime: number;
  exitPrice: number;
  grossPnl: number;
  netPnl: number;
  feePaid: number;
  slippagePaid: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'DAY_END_EXIT' | 'INVALID' | 'OPEN';
  exitReason?: string;
  metadataJson?: Record<string, unknown>;
}

export interface BacktestCurvePoint {
  utcTimeStamp: number;
  value: number;
}

export interface BacktestMetricResponse {
  id: string;
  backtestJobId: string;
  totalTrades: number;
  winTrades: number;
  loseTrades: number;
  breakevenTrades: number;
  winRate: number;
  pnl: number;
  finalEquity: number;
  maxDrawdown: number;
  profitFactor: number | null;
  grossProfit: number;
  grossLoss: number;
  totalFee: number;
  totalSlippage: number;
  equityCurve: BacktestCurvePoint[];
  drawdownCurve: BacktestCurvePoint[];
}
