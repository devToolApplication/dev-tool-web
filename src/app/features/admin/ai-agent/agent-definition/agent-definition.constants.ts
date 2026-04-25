import { AgentDefinitionCreateDto } from '../../../../core/models/ai-agent/agent-definition.model';

export type AgentDefinitionManagementContext = 'ai' | 'codex';

export function getAgentDefinitionRoutes(context: AgentDefinitionManagementContext = 'ai') {
  const basePath = context === 'codex' ? '/admin/codex-agent/agents' : '/admin/ai-agent/agents';
  return {
    list: basePath,
    create: `${basePath}/create`
  } as const;
}

export const AGENT_DEFINITION_INITIAL_VALUE: AgentDefinitionCreateDto = {
  code: '',
  name: '',
  description: '',
  systemPromptTemplateId: '',
  modelConfigId: '',
  executionPolicyId: '',
  executionPolicyJson: '',
  enabled: true,
  defaultActive: false,
  codexConfig: {
    enabled: false,
    model: '',
    mode: '',
    approvalPolicy: 'never',
    workingDirectory: '',
    additionalDirectories: [],
    skipGitRepoCheck: true,
    networkAccessEnabled: true,
    webSearchEnabled: false,
    webSearchMode: 'disabled',
    mcpServerIds: [],
    mcpToolKeys: [],
    skillIds: [],
    agentsInstruction: ''
  },
  status: 'ACTIVE'
};
