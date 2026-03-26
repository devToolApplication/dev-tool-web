export type TradeSideMode = 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
export type TradeBotStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface TradeStrategyBindingResponse {
  id: string;
  name: string;
  exchangeId?: string;
  exchangeCode: string;
  exchangeName?: string;
  symbolId?: string;
  symbolCode: string;
  symbolDisplayName?: string;
  strategyId?: string;
  strategyCode: string;
  strategyName?: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  providerSymbol: string;
  configJson: Record<string, unknown>;
  description?: string;
  status: TradeBotStatus;
}

export interface TradeStrategyBindingCreateDto {
  name?: string;
  exchangeCode: string;
  symbolCode: string;
  strategyCode: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  providerSymbol?: string;
  description?: string;
  configJson: Record<string, unknown>;
  status: TradeBotStatus;
}

export interface TradeStrategyBindingUpdateDto extends TradeStrategyBindingCreateDto {}

export interface TradeStrategyBindingPatchDto {
  name?: string;
  exchangeCode?: string;
  symbolCode?: string;
  strategyCode?: string;
  marketType?: string;
  tradeSideMode?: TradeSideMode;
  providerSymbol?: string;
  description?: string;
  configJson?: Record<string, unknown>;
  status?: TradeBotStatus;
}
