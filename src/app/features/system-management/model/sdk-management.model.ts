export type SdkAgentProvider = 'codex' | 'claude';
export type SdkPreflightStatus = 'READY' | 'DEGRADED' | 'BLOCKED_CONFIG' | 'BLOCKED_MCP';
export type SdkTaskRunStatus =
  | 'BLOCKED_CONFIG'
  | 'BLOCKED_MCP'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_DEPENDENCY'
  | 'RUNNING'
  | 'TIMEOUT';

export interface SdkAgentProviderOption {
  provider: SdkAgentProvider;
  available: boolean;
  health: 'HEALTHY' | 'UNHEALTHY';
}

export interface SdkAgentCatalogItem {
  agentCode: string;
  displayName: string;
  defaultProvider?: SdkAgentProvider;
  supportedProviders: SdkAgentProviderOption[];
  requiredDependencies: string[];
  health: 'HEALTHY' | 'UNHEALTHY';
}

export interface SdkAgentCatalogResponse {
  agents: SdkAgentCatalogItem[];
}

export interface SdkAgentHealthMcpResult {
  name: string;
  status: 'UP' | 'DOWN';
  configured: boolean;
  required: boolean;
  requiredTools: string[];
  missingTools: string[];
  toolCount: number;
  latencyMs: number;
  errorCode?: string;
  error?: string;
}

export interface SdkAgentHealthResponse {
  agentCode: string;
  provider: SdkAgentProvider;
  status: SdkPreflightStatus;
  mcp: SdkAgentHealthMcpResult[];
}

export interface SdkServiceHealthResponse {
  status: string;
  service: string;
  basePath?: string;
  auth: Record<string, unknown>;
  codex: Record<string, unknown>;
  database: Record<string, unknown>;
}

export interface SdkTaskExecuteRequest {
  agentCode: string;
  provider?: SdkAgentProvider;
  prompt: string;
  threadId?: string;
  workingDirectory?: string;
  model?: string;
  reasoningEffort?: string;
  outputSchema?: Record<string, unknown>;
  requestContext?: Record<string, unknown>;
  callbackUrl?: string;
  callbackAuthSecretCode?: string;
}

export interface SdkTaskExecuteResult {
  status: SdkTaskRunStatus;
  agentCode: string;
  provider: SdkAgentProvider;
  model?: string;
  threadId?: string;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
  structuredOutput?: Record<string, unknown>;
  error?: string;
}

export interface SdkTaskRunSummary {
  taskId: string;
  agentCode: string;
  provider: SdkAgentProvider;
  status: SdkTaskRunStatus;
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
  preflight?: {
    status: SdkPreflightStatus;
    agentCode: string;
    provider: SdkAgentProvider;
    mcp: unknown[];
  };
  result?: SdkTaskExecuteResult;
  error?: string;
  statusCode?: number;
}

export interface SdkTaskRunDetail extends SdkTaskRunSummary {
  request?: SdkTaskExecuteRequest;
  events: SdkTaskRunEvent[];
  result?: SdkTaskExecuteResult;
}

export interface SdkTaskRunListResponse {
  items: SdkTaskRunSummary[];
  page: number;
  size: number;
  total: number;
}

export interface SdkTaskRunListQuery {
  page?: number;
  size?: number;
  status?: SdkTaskRunStatus;
  agentCode?: string;
  provider?: SdkAgentProvider;
  threadId?: string;
  createdFrom?: string;
  createdTo?: string;
}