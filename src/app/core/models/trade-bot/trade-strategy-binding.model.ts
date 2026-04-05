export type TradeSideMode = 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
export type TradeBotStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface TradeStrategySelectedRule {
  slotCode: string;
  slotLabel?: string;
  ruleId: string;
  ruleCode?: string;
  ruleName?: string;
  configJson?: Record<string, unknown>;
}

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
  strategyServiceName?: string;
  strategyName?: string;
  ruleId?: string;
  ruleCode?: string;
  ruleName?: string;
  selectedRules?: TradeStrategySelectedRule[];
  marketType: string;
  tradeSideMode: TradeSideMode;
  providerSymbol: string;
  configJson: Record<string, unknown>;
  description?: string;
  status: TradeBotStatus;
}

export interface TradeStrategyBindingCreateDto {
  name?: string;
  exchangeId: string;
  symbolId: string;
  strategyId: string;
  marketType: string;
  tradeSideMode: TradeSideMode;
  providerSymbol?: string;
  configJson?: Record<string, unknown>;
  selectedRules?: TradeStrategySelectedRule[];
  description?: string;
  status: TradeBotStatus;
}

export interface TradeStrategyBindingUpdateDto extends TradeStrategyBindingCreateDto {}

export interface TradeStrategyBindingPatchDto {
  name?: string;
  exchangeId?: string;
  symbolId?: string;
  strategyId?: string;
  marketType?: string;
  tradeSideMode?: TradeSideMode;
  providerSymbol?: string;
  configJson?: Record<string, unknown>;
  selectedRules?: TradeStrategySelectedRule[];
  description?: string;
  status?: TradeBotStatus;
}
