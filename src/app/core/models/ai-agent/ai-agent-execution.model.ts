import { AgentRoleType } from './ai-agent-catalog.model';

export interface AiAgentAvailableAgent {
  code: string;
  name: string;
  roleType: AgentRoleType;
  description?: string;
  modelName?: string;
  status: string;
}

export interface AiAgentExecutionRequest {
  agentCode: string;
  prompt: string;
  workingDirectory?: string;
}

export interface AiAgentExecutionResponse {
  status: string;
  outputText: string;
  items: AiAgentExecutionItem[];
  usage: AiAgentExecutionUsage;
  durationMs: number;
  agentCode: string;
  provider: string;
}

export type AiAgentExecutionItem =
  | { type: 'message'; id: string; text: string }
  | { type: 'command'; id: string; command: string; output: string; exitCode?: number }
  | { type: 'file_change'; id: string; changes: Array<{ path: string; kind: string }> }
  | { type: 'tool_call'; id: string; server: string; tool: string; arguments: unknown; result?: unknown }
  | { type: 'reasoning'; id: string; text: string };

export interface AiAgentExecutionUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  reasoningOutputTokens?: number;
}

export interface AiAgentSseEvent {
  type: 'started' | 'item.started' | 'item.completed' | 'turn.completed' | 'error' | 'done';
  threadId?: string;
  item?: AiAgentExecutionItem;
  usage?: AiAgentExecutionUsage;
  message?: string;
}
