export interface AgentRunContext {
  userId: string;
  sessionId: string;
}

export interface AgentRunRequest {
  input: string;
  context: AgentRunContext;
}

export interface AgentRunResponse {
  jobId: string;
}

export interface AgentEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text_chunk' | 'error' | 'done';
  stepId?: string;
  timestamp: number;
  content?: string;
  tool?: string;
  args?: unknown;
  data?: unknown;
  message?: string;
}

export interface AgentStep {
  id: string;
  events: AgentEvent[];
}
