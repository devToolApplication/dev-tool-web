export type CodexDeviceLoginState = 'pending' | 'authenticated' | 'failed' | 'expired';

export interface CodexAgentAuthStatusResponse {
  mode?: string;
  authenticated?: boolean;
  message?: string;
  exitCode?: number;
}

export interface CodexDeviceLoginSessionResponse {
  sessionId: string;
  state: CodexDeviceLoginState;
  verificationUri?: string;
  userCode?: string;
  createdAt?: string;
  expiresAt?: string;
  authenticatedAt?: string;
  failedAt?: string;
  exitCode?: number;
  message?: string;
  stdout?: string;
  stderr?: string;
}
