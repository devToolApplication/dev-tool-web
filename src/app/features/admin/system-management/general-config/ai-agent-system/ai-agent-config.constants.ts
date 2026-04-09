import { AiAgentConfigCreateDto } from '../../../../../core/models/ai-agent/ai-agent-config.model';

export const AI_AGENT_CONFIG_ROUTES = {
  list: '/admin/system-management/ai-agent-configs',
  create: '/admin/system-management/ai-agent-configs/create'
} as const;

export const AI_AGENT_CONFIG_INITIAL_VALUE: AiAgentConfigCreateDto = {
  category: '',
  key: '',
  value: '{}',
  description: '',
  status: 'ACTIVE'
};
