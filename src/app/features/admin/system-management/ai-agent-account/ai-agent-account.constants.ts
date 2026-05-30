import { AgentAccountRequest } from '../../../../core/models/ai-agent/ai-agent-account.model';

export const AI_AGENT_ACCOUNT_ROUTES = {
  list: '/admin/system-management/ai-agent-accounts',
  create: '/admin/system-management/ai-agent-accounts/create'
} as const;

export const AI_AGENT_ACCOUNT_INITIAL_VALUE: AgentAccountRequest = {
  name: '',
  code: '',
  provider: 'codex',
  authJson: '',
  enabled: true
};
