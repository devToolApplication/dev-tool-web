import { PromptTemplateCreateDto } from '../../../../core/models/ai-agent/prompt-template.model';

export const PROMPT_TEMPLATE_ROUTES = {
  list: '/admin/ai-agent/prompt-templates',
  create: '/admin/ai-agent/prompt-templates/create'
} as const;

export const PROMPT_TEMPLATE_INITIAL_VALUE: PromptTemplateCreateDto = {
  code: '',
  name: '',
  templateType: 'SYSTEM',
  content: '',
  version: 1,
  enabled: true,
  status: 'ACTIVE'
};
