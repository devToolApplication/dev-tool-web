import type { KocBusinessDecision, KocExecutionStatus, KocPageQuery } from './koc-common.model';

export interface KocCandidateSummary {
  candidateId: string;
  campaignId: string;
  displayName: string;
  profileUrl?: string;
  decision: KocBusinessDecision;
  executionStatus: KocExecutionStatus;
  followers?: number;
  screeningProgress?: number;
  reason?: string;
  updatedAt?: string;
}

export interface KocCandidateDetail extends KocCandidateSummary {
  source?: string;
  evidenceCount: number;
  workflowRunId?: string;
}

export interface KocCandidateListQuery extends KocPageQuery {
  campaignId?: string;
  decision?: KocBusinessDecision;
  executionStatus?: KocExecutionStatus;
  rejectReason?: string;
  minFollowers?: number;
  maxFollowers?: number;
}
