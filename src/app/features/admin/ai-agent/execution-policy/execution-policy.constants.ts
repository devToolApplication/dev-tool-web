import { ExecutionPolicyConfigCreateDto } from '../../../../core/models/ai-agent/execution-policy.model';

export const EXECUTION_POLICY_ROUTES = {
  list: '/admin/ai-agent/execution-policies',
  create: '/admin/ai-agent/execution-policies/create'
} as const;

export const EXECUTION_POLICY_INITIAL_VALUE: ExecutionPolicyConfigCreateDto = {
  code: '',
  name: '',
  maxSteps: 6,
  maxToolCallsPerStep: 8,
  allowParallelTools: false,
  modelTimeoutMs: 30000,
  toolTimeoutMs: 10000,
  fallbackModelConfigId: '',
  nativeToolPreferred: false,
  enabled: true
};
