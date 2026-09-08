export interface CodexAgentProviderOption {
  provider: string;
  available: boolean;
  health?: string;
}

export interface CodexAgentCatalogItem {
  agentCode: string;
  displayName: string;
  defaultProvider?: string;
  supportedProviders: CodexAgentProviderOption[];
  requiredDependencies?: string[];
  health?: string;
}

export interface CodexThreadItem {
  id: string;
  previewText?: string;
  turnCount?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CodexToolCall {
  id?: string;
  name: string;
  input?: Record<string, unknown> | unknown;
  output?: Record<string, unknown> | unknown;
  status?: 'pending' | 'success' | 'failed';
}

export interface CodexStreamPreflight {
  status: string;
  agentCode: string;
  provider: string;
  mcp?: Array<{
    server: string;
    configured: boolean;
    connected: boolean;
    tools: string[];
  }>;
}

export interface CodexTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  toolCalls?: CodexToolCall[];
  status?: 'streaming' | 'completed' | 'failed';
  reasoning?: string;
  preflight?: CodexStreamPreflight;
  stderrLog?: string[];
  requestContext?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface CodexThreadDetail {
  id: string;
  turns: CodexTurn[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodexPromptRequest {
  prompt: string;
  threadId?: string | null;
  agentCode?: string;
  provider?: string;
  model?: string;
  tools?: string[];
  systemPrompt?: string;
  stream?: boolean;
  requestContext?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface CodexStreamEvent {
  event: 'message' | 'tool_call' | 'error' | 'done';
  data: string;
}

export interface CodexThreadListResponse {
  data: CodexThreadItem[];
  nextCursor?: string | null;
  total?: number;
}
