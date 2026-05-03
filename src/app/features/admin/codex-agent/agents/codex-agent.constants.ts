import { CodexAgentCreateDto } from '../../../../core/models/codex-agent/codex-agent.model';

export const CODEX_AGENT_ROUTES = {
  list: '/admin/codex-agent/agents',
  create: '/admin/codex-agent/agents/create'
} as const;

export const CODEX_AGENT_INITIAL_VALUE: CodexAgentCreateDto = {
  code: '',
  name: '',
  description: '',
  model: '',
  reasoningEffort: 'medium',
  sandboxMode: 'workspace-write',
  approvalPolicy: 'on-request',
  instruction: '',
  authJson: '',
  installationId: '',
  enabled: true,
  status: 'ACTIVE'
};
