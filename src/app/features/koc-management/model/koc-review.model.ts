import type { KocBusinessDecision, KocPageQuery } from './koc-common.model';

export type KocReviewStatus = 'PENDING' | 'RESOLVED' | 'CANCELLED';
export type KocReviewReason = 'EVIDENCE_CONFLICT' | 'BORDERLINE_POLICY' | 'MANUAL_POLICY';

export interface KocReviewQueueItem {
  reviewId: string;
  candidateId: string;
  campaignId: string;
  reason: KocReviewReason;
  status: KocReviewStatus;
  assignedTo?: string;
  updatedAt?: string;
}

export interface KocReviewDecisionPayload {
  decision: Extract<KocBusinessDecision, 'ACCEPTED' | 'REJECTED' | 'SCREENING'>;
  reason: string;
}

export interface KocReviewListQuery extends KocPageQuery {
  status?: KocReviewStatus;
}
