export interface ExchangeResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  marketDataProvider?: string;
  tradingProvider?: string;
  metadataJson?: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface SymbolResponse {
  id: string;
  code: string;
  displayName: string;
  marketType: string;
  providerSymbol?: string;
  description?: string;
  metadataJson?: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface StrategyResponse {
  id: string;
  serviceName: string;
  name: string;
  description?: string;
  version?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface StrategyCreateDto {
  serviceName: string;
  name: string;
  description?: string;
  version?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface StrategyUpdateDto extends StrategyCreateDto {}
