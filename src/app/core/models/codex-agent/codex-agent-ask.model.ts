export interface CodexAgentAskRequest {
  agentId?: string;
  model?: string;
  mode?: string;
  userPrompt: string;
}

export interface CodexAgentOptionItem {
  value: string;
  label: string;
  isDefault?: boolean;
}

export interface CodexAgentOptionsResponse {
  defaultModel?: string;
  defaultMode?: string;
  models: CodexAgentOptionItem[];
  modes: CodexAgentOptionItem[];
  mcpServers: CodexAgentMcpServer[];
  agents: CodexAgentProfile[];
}

export interface CodexAgentMcpServer {
  value: string;
  label: string;
  enabled?: boolean;
  reason?: string;
}

export interface CodexAgentMcpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface CodexAgentMcpToolsResponse {
  server: CodexAgentMcpServer;
  tools: CodexAgentMcpTool[];
}

export interface CodexAgentMcpServersResponse {
  servers: CodexAgentMcpServer[];
}

export interface CodexAgentProfile {
  id: string;
  code: string;
  name: string;
  codexEnabled?: boolean;
  codexModel?: string;
  codexMode?: string;
  skillCount?: number;
  mcpServerIds?: string[];
  mcpToolKeys?: string[];
}

export interface CodexUsageResponse {
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface CodexAgentAskResponse {
  success: boolean;
  answer?: string;
  executionStatus?: string;
  errorMessage?: string;
  totalToken?: number;
  iterationCount?: number;
  localThreadId?: string;
  codexThreadId?: string;
  codexUsage?: CodexUsageResponse;
  agentId?: string;
  agentCode?: string;
  agentName?: string;
  materializedSkills?: string[];
  mcpServers?: string[];
  mcpToolKeys?: string[];
  toolExecutions?: {
    callId?: string;
    toolName?: string;
    arguments?: string;
    result?: string;
  }[];
}
