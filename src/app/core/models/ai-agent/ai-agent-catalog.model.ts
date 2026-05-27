import { AiAgentFeatureStatus } from './ai-agent-model.model';

export type AgentRoleType = 'CUSTOM' | 'BA' | 'DEV' | 'REVIEW' | 'QA' | 'SYSTEM';

export interface AiAgentAgentConfigResponse {
  id: string;
  name: string;
  roleType: AgentRoleType;
  customRoleType?: string;
  modelConfigId: string;
  modelName?: string;
  systemPrompt: string;
  description?: string;
  status: AiAgentFeatureStatus;
}

export interface AiAgentAgentConfigRequest {
  name: string;
  roleType: AgentRoleType;
  customRoleType?: string;
  modelConfigId: string;
  systemPrompt: string;
  description?: string;
  status: AiAgentFeatureStatus;
}
