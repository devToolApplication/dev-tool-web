export interface AgentAccountResponse {
  id: string;
  code: string;
  name: string;
  provider: string;
  enabled: boolean;
  lastUsedAt?: string;
  rateLimitReachedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAccountRequest {
  code: string;
  name: string;
  provider: string;
  authJson?: string;
  enabled: boolean;
}

export interface DeviceLoginSessionResponse {
  sessionId: string;
  accountId: string;
  state: 'pending' | 'authenticated' | 'failed' | 'expired';
  verificationUri?: string;
  userCode?: string;
  createdAt: string;
  expiresAt?: string;
  error?: string;
}
