import type { KocAiExecutionConfig, KocAuditInfo, KocPageQuery } from './koc-common.model';
import type { KocDiscoverySignal, KocSearchStrategy } from './koc-discovery.model';
import type { KocScreeningRule } from './koc-rule.model';

export interface KocCampaignGoal {
  targetApproved: number;
  candidateLimit: number;
}

export interface KocCampaignSearchScope {
  platforms: string[];
  minFollowers: number | null;
  maxFollowers: number | null;
  locations: string[];
  languages: string[];
  recentActivityDays: number | null;
}

export interface KocCampaignRequirement {
  id: string;
  title: string;
  description: string;
  importance: 'REQUIRED' | 'PREFERRED';
  minimumConfidence: number | null;
  minimumEvidence: number | null;
}

export interface KocCampaignWorkflowRef {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersion: number | null;
  workflowName?: string;
}

export interface KocCampaignSearchConfig {
  instructions?: string;
  scope?: Partial<KocCampaignSearchScope>;
  requirements?: KocCampaignRequirement[];
}

export interface KocCampaignWorkflowConfig {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersion?: number | null;
}

export type KocCampaignStatus =
  | 'DRAFT'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'STOPPED'
  | 'BLOCKED';

export interface KocCampaignCounters {
  discovered: number;
  unique: number;
  screened: number;
  rejected: number;
  review: number;
  accepted: number;
  waiting: number;
}

export interface KocRejectionReasonSummary {
  reason: string;
  count: number;
}

export interface KocCampaignSummary extends KocAuditInfo {
  campaignId: string;
  name: string;
  code: string;
  status: KocCampaignStatus;
  acceptedTarget: number;
  counters: KocCampaignCounters;
  lastActivityAt?: string;
}

export interface KocCampaignDetail extends KocCampaignSummary {
  description?: string;
  version: number;
  goal?: KocCampaignGoal;
  search?: KocCampaignSearchConfig;
  workflow?: KocCampaignWorkflowConfig;
  workflowDefinitionId?: string;
  workflowVersionId?: string;
  requirement?: string;
  note?: string;
  discoveryWorkflowId?: string;
  screeningWorkflowId?: string;
  discoveryExecution?: KocAiExecutionConfig;
  screeningExecution?: KocAiExecutionConfig;
  discoverySignals?: KocDiscoverySignal[];
  searchStrategies?: KocSearchStrategy[];
  screeningRules?: KocScreeningRule[];
  topRejectionReasons?: KocRejectionReasonSummary[];
}

export interface KocCampaignUpsertPayload {
  name: string;
  description?: string;
  goal: KocCampaignGoal;
  search: KocCampaignSearchConfig;
  workflow: KocCampaignWorkflowConfig;
}

export type KocCandidateEvaluationStartStatus =
  | 'STARTED'
  | 'SKIPPED_ALREADY_COMPLETED'
  | 'START_FAILED';

export interface KocCandidateEvaluationStartPayload {
  candidateId: string;
  workflowId?: string;
}

export interface KocCandidateEvaluationStartResult {
  campaignId: string;
  candidateId: string;
  workflowId?: string;
  workflowRunId?: string;
  status: KocCandidateEvaluationStartStatus;
  reason?: string;
}

export interface KocCampaignListQuery extends KocPageQuery {
  status?: KocCampaignStatus;
}
