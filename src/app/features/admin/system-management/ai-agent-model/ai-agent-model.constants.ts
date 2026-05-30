import { AiAgentModelConfigRequest } from '../../../../core/models/ai-agent/ai-agent-model.model';

export const AI_AGENT_MODEL_ROUTES = {
  list: '/admin/system-management/ai-agent-models',
  create: '/admin/system-management/ai-agent-models/create'
} as const;

export const AI_AGENT_MODEL_INITIAL_VALUE: AiAgentModelConfigRequest = {
  name: '',
  providerType: 'API',
  providerCode: 'OPENROUTER',
  modelName: '',
  secretReferenceId: '',
  description: '',
  status: 'ENABLED',
  authMethod: undefined,
  baseUrl: '',
  maxTokens: undefined,
  temperature: undefined,
  capabilities: []
};
