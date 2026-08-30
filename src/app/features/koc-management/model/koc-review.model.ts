import type { KocPageQuery } from './koc-common.model';

export type KocReviewStatus = 'NOT_REVIEWED' | 'APPROVED' | 'REJECTED' | 'NEED_MORE_EVIDENCE';
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
  decision: KocReviewStatus;
  reason: string;
}

export interface KocReviewHistoryItem {
  reviewId: string;
  candidateId: string;
  campaignId: string;
  matchType?: string;
  reason?: KocReviewReason;
  status: KocReviewStatus;
  decision: KocReviewStatus;
  decisionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt?: string;
}

export interface KocReviewListQuery extends KocPageQuery {
  status?: KocReviewStatus;
}

