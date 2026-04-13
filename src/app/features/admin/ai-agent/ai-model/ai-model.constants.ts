import { AiModelCreateDto } from '../../../../core/models/ai-agent/ai-model.model';

export const AI_MODEL_ROUTES = {
  list: '/admin/ai-agent/models',
  create: '/admin/ai-agent/models/create'
} as const;

export const AI_MODEL_INITIAL_VALUE: AiModelCreateDto = {
  code: '',
  modelName: '',
  description: '',
  modelType: '',
  providerModelType: 'GROQ',
  status: 'ACTIVE',
  defaultActive: false,
  url: '',
  apiType: 'OPENAI_COMPATIBLE',
  toolSupportMode: 'FAKE_PROMPT',
  timeoutMs: 30000,
  maxContext: 0,
  metadata: []
};
