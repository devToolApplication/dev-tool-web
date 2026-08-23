export type KocEvidenceState =
  | 'FOUND'
  | 'NOT_FOUND'
  | 'INSUFFICIENT'
  | 'UNKNOWN'
  | 'FETCH_ERROR'
  | 'UNSUPPORTED';

export interface KocEvidenceItem {
  evidenceId: string;
  ruleId?: string;
  state: KocEvidenceState;
  sourceType: string;
  observedAt?: string;
  excerpt?: string;
  sourceUrl?: string;
  coverage?: string;
  agentCode?: string;
  provider?: string;
}
