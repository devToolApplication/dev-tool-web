export interface TradeBotSecretResponse {
  id: string;
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface TradeBotSecretCreateDto {
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

export interface TradeBotSecretUpdateDto {
  category?: string;
  name?: string;
  code?: string;
  secretValue?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}
