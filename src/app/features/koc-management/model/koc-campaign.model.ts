import type { KocAiExecutionConfig, KocAuditInfo, KocPageQuery } from './koc-common.model';
import type { KocDiscoverySignal, KocSearchStrategy } from './koc-discovery.model';
import type { KocScreeningRule } from './koc-rule.model';

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
  discoveryExecution: KocAiExecutionConfig;
  screeningExecution?: KocAiExecutionConfig;
  discoverySignals?: KocDiscoverySignal[];
  searchStrategies?: KocSearchStrategy[];
  screeningRules?: KocScreeningRule[];
  topRejectionReasons?: KocRejectionReasonSummary[];
}

export interface KocCampaignUpsertPayload {
  name: string;
  code: string;
  description?: string;
  targetAccepted: number;
  maximumDiscovered: number;
  maximumScreened: number;
  discoveryExecution: KocAiExecutionConfig;
  screeningExecution?: KocAiExecutionConfig;
  discoverySignals?: KocDiscoverySignal[];
  searchStrategies?: KocSearchStrategy[];
  screeningRules?: KocScreeningRule[];
}

export interface KocCampaignListQuery extends KocPageQuery {
  status?: KocCampaignStatus;
}
