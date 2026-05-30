import { AiAgentAuthProfileRequest } from '../../../../core/models/ai-agent/ai-agent-auth-profile.model';

export const AI_AGENT_AUTH_PROFILE_ROUTES = {
  list: '/admin/system-management/ai-agent-auth-profiles',
  create: '/admin/system-management/ai-agent-auth-profiles/create'
} as const;

export const AI_AGENT_AUTH_PROFILE_INITIAL_VALUE: AiAgentAuthProfileRequest = {
  name: '',
  code: '',
  providerCode: 'CODEX',
  authMethod: 'API_KEY',
  accessToken: '',
  refreshToken: '',
  tokenExpiry: undefined,
  tokenEndpoint: '',
  secretReferenceId: '',
  sessionConfig: undefined,
  scopeType: 'GLOBAL',
  status: 'ENABLED',
  description: ''
};
