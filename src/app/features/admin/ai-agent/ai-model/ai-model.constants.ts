import { AiModelCreateDto } from '../../../../core/models/ai-agent/ai-model.model';

export const AI_MODEL_ROUTES = {
  list: '/admin/ai-agent/models',
  create: '/admin/ai-agent/models/create'
} as const;

export const AI_MODEL_INITIAL_VALUE: AiModelCreateDto = {
  modelName: '',
  description: '',
  modelType: '',
  providerModelType: 'GROQ',
  status: 'ACTIVE',
  defaultActive: false,
  url: '',
  metadata: []
};
