export type JsonObject = Record<string, unknown>;

export type SdkTaskProvider = 'codex' | 'claude';

export type SdkTaskStatus =
  | 'BLOCKED_CONFIG'
  | 'BLOCKED_MCP'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_DEPENDENCY'
  | 'RUNNING'
  | 'TIMEOUT';

export interface SdkTaskRunRequest {
  agentCode: string;
  provider?: SdkTaskProvider;
  prompt: string;
  threadId?: string;
  workingDirectory?: string;
  model?: string;
  reasoningEffort?: string;
  outputSchema?: JsonObject;
  requestContext?: JsonObject;
  callbackUrl?: string;
  callbackAuthSecretCode?: string;
}

export interface SdkTaskRunListQuery {
  page?: number;
  size?: number;
  status?: SdkTaskStatus;
  agentCode?: string;
  provider?: SdkTaskProvider;
  threadId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface SdkTaskRunSummary {
  taskId: string;
  status: SdkTaskStatus;
  agentCode: string;
  provider?: SdkTaskProvider;
  workingDirectory?: string;
  threadId?: string;
  model?: string;
  reasoningEffort?: string;
  promptPreview: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface SdkTaskRunEvent {
  sequence: number;
  at: string;
  type: 'accepted' | 'preflight' | 'stdout' | 'stderr' | 'result' | 'error';
  data?: string;
  preflight?: unknown;
  result?: SdkTaskExecuteResult;
  error?: string;
  statusCode?: number;
}

export type SdkTaskRunRequestSnapshot = Omit<SdkTaskRunRequest, 'callbackAuthSecretCode'> & {
  callbackAuthSecretConfigured?: boolean;
};

export interface SdkTaskExecuteResult {
  status: Exclude<SdkTaskStatus, 'RUNNING'>;
  agentCode: string;
  provider: SdkTaskProvider;
  preflight: unknown;
  execution?: {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: string | null;
    durationMs: number;
    errorCode?: string;
    structuredOutput?: unknown;
  };
}

export interface SdkTaskRunDetail extends SdkTaskRunSummary {
  request?: SdkTaskRunRequestSnapshot;
  events: SdkTaskRunEvent[];
  result?: SdkTaskExecuteResult;
}

export interface SdkTaskRunListResponse {
  items: SdkTaskRunSummary[];
  page: number;
  size: number;
  total: number;
}
