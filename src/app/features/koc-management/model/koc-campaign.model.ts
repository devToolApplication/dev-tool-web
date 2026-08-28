import type { KocAiExecutionConfig, KocAuditInfo, KocPageQuery } from './koc-common.model';
import type { KocDiscoverySignal, KocSearchStrategy } from './koc-discovery.model';
import type { KocScreeningRule } from './koc-rule.model';
import type {
  CampaignGoal,
  CampaignRequirement,
  CampaignSearchScope,
  CampaignWorkflowRef,
} from './koc-campaign-editor.model';

export type {
  CampaignGoal as KocCampaignGoal,
  CampaignSearchScope as KocCampaignSearchScope,
  CampaignRequirement as KocCampaignRequirement,
  CampaignWorkflowRef as KocCampaignWorkflowRef,
};

export interface KocCampaignSearchConfig {
  instructions?: string;
  scope?: Partial<CampaignSearchScope>;
  requirements?: CampaignRequirement[];
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
  goal?: CampaignGoal;
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
  goal: CampaignGoal;
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