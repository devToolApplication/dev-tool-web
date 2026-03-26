export type TradeBotDataResource = 'BINANCE' | 'OANDA';

export type TradeBotSymbol = string;

export type TradeBotStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface SyncConfigResponse {
  id: string;
  dataResource: TradeBotDataResource;
  symbol: TradeBotSymbol;
  intervals: string[];
  status: TradeBotStatus;
}

export interface SyncConfigCreateDto {
  dataResource: TradeBotDataResource;
  symbol: TradeBotSymbol;
  intervals: string[];
  status: TradeBotStatus;
}

export interface SyncConfigUpdateDto {
  dataResource?: TradeBotDataResource;
  symbol?: TradeBotSymbol;
  intervals?: string[];
  status?: TradeBotStatus;
}
