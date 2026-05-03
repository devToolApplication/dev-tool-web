import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type CodexReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type CodexSandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';
export type CodexApprovalPolicy = 'never' | 'on-request' | 'on-failure' | 'untrusted';
export type CodexUsageSource = 'auth_json' | 'runtime_rate_limits' | 'derived' | 'unavailable';
export type CodexUsageScope = 'hourly' | 'weekly';

export interface CodexAgentOptionItemResponse {
  value: string;
  label: string;
  description: string;
}

export interface CodexAgentFieldDescriptionResponse {
  key: string;
  label: string;
  description: string;
}

export interface CodexAgentOptionsResponse {
  defaults?: {
    model?: string;
    reasoningEffort?: CodexReasoningEffort;
    sandboxMode?: CodexSandboxMode;
    approvalPolicy?: CodexApprovalPolicy;
  };
  fields?: CodexAgentFieldDescriptionResponse[];
  models?: CodexAgentOptionItemResponse[];
  reasoningEfforts?: CodexAgentOptionItemResponse[];
  sandboxModes?: CodexAgentOptionItemResponse[];
  approvalPolicies?: CodexAgentOptionItemResponse[];
}

export interface CodexAgentResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  sandboxMode?: CodexSandboxMode;
  approvalPolicy?: CodexApprovalPolicy;
  instruction?: string;
  authJson?: string;
  installationId?: string;
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface CodexAgentCreateDto {
  code: string;
  name: string;
  description?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  sandboxMode?: CodexSandboxMode;
  approvalPolicy?: CodexApprovalPolicy;
  instruction?: string;
  authJson?: string;
  installationId?: string;
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface CodexAgentUpdateDto {
  code?: string;
  name?: string;
  description?: string;
  model?: string;
  reasoningEffort?: CodexReasoningEffort;
  sandboxMode?: CodexSandboxMode;
  approvalPolicy?: CodexApprovalPolicy;
  instruction?: string;
  authJson?: string;
  installationId?: string;
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface CodexAgentHomeSyncResponse {
  agentId: string;
  agentCode: string;
  agentHome: string;
  syncedAt: string;
}

export interface CodexAgentDeviceLoginSessionResponse {
  sessionId: string;
  agentId: string;
  agentCode: string;
  state: 'pending' | 'authenticated' | 'failed' | 'expired' | string;
  verificationUri?: string;
  userCode?: string;
  createdAt?: string;
  expiresAt?: string;
  authenticatedAt?: string;
  failedAt?: string;
  exitCode?: number | null;
  message?: string;
  stdout?: string;
  stderr?: string;
}

export interface CodexAgentUsageWindowResponse {
  scope: CodexUsageScope;
  source: CodexUsageSource;
  limit?: number;
  remaining?: number;
  used?: number;
  usedPercent?: number;
  remainingPercent?: number;
  resetAt?: string;
  resetMode?: string;
  windowHours?: number;
  note?: string;
}

export interface CodexAgentAuthStatusResponse {
  agentId: string;
  agentCode: string;
  authenticated?: boolean;
  configured?: boolean;
  mode?: string;
  source?: string;
  message?: string;
  accountId?: string;
  accountEmail?: string;
  accountName?: string;
  userId?: string;
  planType?: string;
  subscriptionActiveFrom?: string;
  subscriptionActiveUntil?: string;
  subscriptionLastChecked?: string;
  subscriptionRemainingDays?: number;
  lastRefreshAt?: string;
  accessTokenExpiresAt?: string;
  idTokenExpiresAt?: string;
  accessTokenRemainingSeconds?: number;
  limitSummary?: string;
  usage?: {
    hourly?: CodexAgentUsageWindowResponse;
    weekly?: CodexAgentUsageWindowResponse;
  };
}
