export type KocProvider = 'codex' | 'claude';

export interface KocAiExecutionConfig {
  agentCode: string;
  provider?: KocProvider;
}

export type KocHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type KocExecutionStatus =
  | 'DISCOVERED'
  | 'ENRICHING'
  | 'READY_FOR_SCREENING'
  | 'SCREENING_QUEUED'
  | 'SCREENING_RUNNING'
  | 'MANUAL_REVIEW'
  | 'ERROR'
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING'
  | 'WAITING_DEPENDENCY'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type KocBusinessDecision = 'ACCEPTED' | 'REJECTED' | 'REVIEW' | 'SCREENING' | 'WAITING';

export interface KocPageQuery {
  page?: number;
  size?: number;
  sort?: string[];
  search?: string;
}

export interface KocAuditInfo {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface KocApiErrorDetail {
  code: string;
  dependencyKey?: string;
  technicalDetail?: string;
}
