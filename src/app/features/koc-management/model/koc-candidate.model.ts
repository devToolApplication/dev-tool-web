import type { KocBusinessDecision, KocExecutionStatus, KocPageQuery } from './koc-common.model';
import type { KocReviewStatus } from './koc-review.model';

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

export interface KocCandidateBulkApproveItem {
  candidateId: string;
  reason?: string;
}

export interface KocCandidateBulkApproveRequest {
  campaignId: string;
  candidates: KocCandidateBulkApproveItem[];
}

export interface KocCandidateBulkRejectItem {
  candidateId: string;
  reason?: string;
}

export interface KocCandidateBulkRejectRequest {
  campaignId: string;
  candidates: KocCandidateBulkRejectItem[];
}

export interface KocCandidateBulkDecisionItem {
  candidateId: string;
  decision: KocReviewStatus;
  reason?: string;
}

export interface KocCandidateBulkDecisionRequest {
  campaignId: string;
  items: KocCandidateBulkDecisionItem[];
}

export interface KocCandidateBulkActionResult {
  candidateId: string;
  success: boolean;
  errorMessage?: string;
}

export interface KocCandidateBulkActionResponse {
  results: KocCandidateBulkActionResult[];
  successCount: number;
  failureCount: number;
}

export interface KocBulkReviewReasonRequest {
  candidateId: string;
  reason?: string;
}

export interface KocBulkReviewRequest {
  candidateIds: string[];
  reasons?: KocBulkReviewReasonRequest[];
}

export interface KocBulkReviewResponse {
  results: KocCandidateBulkActionResult[];
  successCount: number;
  failureCount: number;
}
