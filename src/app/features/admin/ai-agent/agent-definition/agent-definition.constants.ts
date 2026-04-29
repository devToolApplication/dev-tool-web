import { AgentDefinitionCreateDto } from '../../../../core/models/ai-agent/agent-definition.model';

export const AGENT_DEFINITION_ROUTES = {
  list: '/admin/ai-agent/agents',
  create: '/admin/ai-agent/agents/create'
} as const;

export const AGENT_DEFINITION_INITIAL_VALUE: AgentDefinitionCreateDto = {
  code: '',
  name: '',
  description: '',
  systemPromptTemplateId: '',
  modelConfigId: '',
  executionPolicyId: '',
  executionPolicyJson: '',
  enabled: true,
  defaultActive: false,
  status: 'ACTIVE'
};
