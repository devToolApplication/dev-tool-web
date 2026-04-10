export interface ExecutionPolicyConfigResponse {
  id: string;
  code: string;
  name: string;
  maxSteps?: number;
  maxToolCallsPerStep?: number;
  allowParallelTools?: boolean;
  modelTimeoutMs?: number;
  toolTimeoutMs?: number;
  fallbackModelConfigId?: string;
  nativeToolPreferred?: boolean;
  enabled?: boolean;
}

export interface ExecutionPolicyConfigCreateDto {
  code: string;
  name: string;
  maxSteps?: number;
  maxToolCallsPerStep?: number;
  allowParallelTools?: boolean;
  modelTimeoutMs?: number;
  toolTimeoutMs?: number;
  fallbackModelConfigId?: string;
  nativeToolPreferred?: boolean;
  enabled?: boolean;
}

export interface ExecutionPolicyConfigUpdateDto {
  code?: string;
  name?: string;
  maxSteps?: number;
  maxToolCallsPerStep?: number;
  allowParallelTools?: boolean;
  modelTimeoutMs?: number;
  toolTimeoutMs?: number;
  fallbackModelConfigId?: string;
  nativeToolPreferred?: boolean;
  enabled?: boolean;
}
