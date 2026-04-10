import { AiAgentSecretCreateDto } from '../../../../../core/models/ai-agent/ai-agent-secret.model';

export const AI_AGENT_SECRET_ROUTES = {
  list: '/admin/system-management/ai-agent-secrets',
  create: '/admin/system-management/ai-agent-secrets/create'
} as const;

export const AI_AGENT_SECRET_INITIAL_VALUE: AiAgentSecretCreateDto = {
  category: '',
  name: '',
  code: '',
  secretValue: '',
  provider: '',
  scopeType: 'GLOBAL',
  scopeRef: '',
  enabled: true,
  rotationVersion: 1,
  description: '',
  status: 'ACTIVE'
};
