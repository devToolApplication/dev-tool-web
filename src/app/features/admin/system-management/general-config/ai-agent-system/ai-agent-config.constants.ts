import { AiAgentConfigCreateDto } from '../../../../../core/models/ai-agent/ai-agent-config.model';

export const AI_AGENT_CONFIG_ROUTES = {
  list: '/admin/ai-agent/configs',
  create: '/admin/ai-agent/configs/create'
} as const;

export const AI_AGENT_CONFIG_INITIAL_VALUE: AiAgentConfigCreateDto = {
  category: '',
  key: '',
  value: '',
  valueType: 'STRING',
  configGroup: '',
  scopeType: 'GLOBAL',
  scopeRef: '',
  description: '',
  enabled: true,
  status: 'ACTIVE'
};
