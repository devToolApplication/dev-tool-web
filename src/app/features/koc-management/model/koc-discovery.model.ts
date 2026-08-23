import type { KocExecutionStatus } from './koc-common.model';

export interface KocDiscoverySignal {
  key: string;
  label: string;
  enabled: boolean;
  weight: number;
}

export interface KocSearchStrategy {
  strategyId?: string;
  name: string;
  enabled: boolean;
  priority: number;
  keywords: string[];
  maxQueries: number;
  maxCandidates: number;
}

export interface KocDiscoveryStrategySummary {
  strategyId: string;
  name: string;
  runs: number;
  found: number;
  newCandidates: number;
  duplicateCandidates: number;
  yieldRate: number;
  status: KocExecutionStatus;
}

export interface KocDiscoveryRun {
  runId: string;
  strategyId: string;
  status: KocExecutionStatus;
  provider?: string;
  agentCode?: string;
  querySummary?: string;
  found: number;
  newCandidates: number;
  duplicateCandidates: number;
  durationMs?: number;
}
