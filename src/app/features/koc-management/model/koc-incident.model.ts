import type { KocHealthStatus, KocPageQuery } from './koc-common.model';

export type KocIncidentStatus = 'BLOCKED' | 'RECOVERING' | 'HEALTHY' | 'OPEN' | 'RESOLVED';

export interface KocIncidentSummary {
  incidentId: string;
  dependencyKey: string;
  status: KocIncidentStatus;
  health: KocHealthStatus;
  waitingWorkflows: number;
  affectedCampaigns: number;
  agentCode?: string;
  provider?: string;
  startedAt?: string;
  lastFailureAt?: string;
}

export interface KocIncidentDetail extends KocIncidentSummary {
  stableErrorCode: string;
  businessImpact: string;
  affectedProviders: string[];
}

export interface KocIncidentListQuery extends KocPageQuery {
  status?: KocIncidentStatus;
  dependencyKey?: string;
}

export interface KocRecoveryProgress {
  recovered: number;
  running: number;
  queued: number;
  failed: number;
}
