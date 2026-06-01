import { AiAgentAgentConfigRequest } from '../../../../core/models/ai-agent/ai-agent-catalog.model';

export const AI_AGENT_CATALOG_ROUTES = {
  list: '/admin/ai-agent/agents',
  create: '/admin/ai-agent/agents/create'
} as const;

export const AI_AGENT_CATALOG_INITIAL_VALUE: AiAgentAgentConfigRequest = {
  name: '',
  roleType: 'DEV',
  customRoleType: '',
  modelConfigId: '',
  systemPrompt: '',
  description: '',
  status: 'ENABLED'
};
