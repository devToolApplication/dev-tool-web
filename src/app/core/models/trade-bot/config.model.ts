export interface TradeBotConfigResponse {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface TradeBotConfigCreateDto {
  category: string;
  key: string;
  value: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface TradeBotConfigUpdateDto {
  category?: string;
  key?: string;
  value?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}
