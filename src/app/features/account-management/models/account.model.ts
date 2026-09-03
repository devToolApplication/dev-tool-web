export type AccountType = 'OPENAI' | 'GOOGLE' | 'CLAUDE' | 'GITHUB' | 'TWITTER' | 'CUSTOM' | string;

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface AccountItem {
  id: string;
  name: string;
  type: AccountType;
  username: string;
  password?: string;
  twoFactorSecret?: string;
  backupCodes?: string[];
  status: AccountStatus;
  note?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AccountCreateRequest {
  name: string;
  type: string;
  username: string;
  password?: string;
  twoFactorSecret?: string;
  backupCodes?: string[];
  status?: AccountStatus;
  note?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface AccountUpdateRequest {
  name: string;
  type: string;
  username: string;
  password?: string;
  twoFactorSecret?: string;
  backupCodes?: string[];
  status?: AccountStatus;
  note?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface AccountQueryParams {
  page?: number;
  size?: number;
  type?: string;
  status?: string;
  keyword?: string;
  sort?: string;
}