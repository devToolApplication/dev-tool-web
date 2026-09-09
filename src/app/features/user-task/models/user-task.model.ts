export const SUPPORTED_FORM_KEYS = {
  KOC_CANDIDATE_APPROVAL: 'KOC_CANDIDATE_APPROVAL',
  KOC_DISCOVERY_DECISION: 'KOC_DISCOVERY_DECISION',
  MANUAL_2FA_CONFIRMATION: 'MANUAL_2FA_CONFIRMATION',
  APPROVAL: 'APPROVAL',
} as const;

export type SupportedFormKey = (typeof SUPPORTED_FORM_KEYS)[keyof typeof SUPPORTED_FORM_KEYS];

export type UserTaskView = 'MY' | 'CLAIMABLE' | 'ALL';
export type UserTaskStatus = 'ACTIVE' | 'COMPLETED';

export interface UserTaskQuery {
  view?: UserTaskView;
  status?: UserTaskStatus;
  keyword?: string;
  formKey?: string;
  businessKey?: string;
  dueAfter?: string;
  dueBefore?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface UserTaskSummary {
  taskId: string;
  processInstanceId: string;
  businessKey?: string;
  formKey: string;
  taskName: string;
  processDefinitionName?: string;
  assignee?: string;
  createdAt: string;
  dueAt?: string;
  priority: number;
  completed: boolean;
  claimable: boolean;
  readOnly: boolean;
  canAct: boolean;
  allowedActions: string[];
}

export interface UserTaskDecision {
  visible: boolean;
  claimable: boolean;
  readOnly: boolean;
  canAct: boolean;
}

export interface UserTaskDetail<T = unknown> {
  task: UserTaskSummary;
  supported: boolean;
  content: T | null;
  allowedActions: string[];
  permission: UserTaskDecision;
}

export interface UserTaskHistoryItem {
  id: string;
  taskId: string;
  processInstanceId: string;
  type: string;
  userId: string;
  time: string;
  message: string;
  requestId?: string;
  action?: string;
  comment?: string;
}

export interface UserTaskActionRequest {
  requestId: string;
  action: string;
  variables?: Record<string, unknown>;
  comment?: string;
}

export interface UserTaskActionResponse {
  taskId: string;
  requestId: string;
  action: string;
  status: string;
  completedAt: string;
  actor?: string;
}

// 17A Content
export interface KocCandidateApprovalItem {
  externalProfileId: string;
  fullName: string;
  profileUrl: string;
  platform: string;
  followerCount: number;
  engagementRate: number;
  score: number;
  strengths: string[];
  risks: string[];
  reviewNote?: string;
}

export interface KocCandidateApprovalContent {
  campaignId: string;
  campaignName: string;
  niche: string;
  targetCount: number;
  minScore: number;
  candidates: KocCandidateApprovalItem[];
}

// 17B Content
export interface KocCandidatePreviewItem {
  externalProfileId: string;
  fullName: string;
  profileUrl: string;
  platform: string;
  followerCount: number;
  score: number;
}

export interface KocDiscoveryDecisionContent {
  campaignId: string;
  campaignName: string;
  niche: string;
  currentRound: number;
  roundLimit: number;
  qualifiedCount: number;
  targetCount: number;
  candidatePreview: KocCandidatePreviewItem[];
}

// 17C Content
export interface Manual2faConfirmationContent {
  platform: string;
  actionRequired: string;
  verificationNumber?: string;
  message: string;
}

// 17D Content
export interface GenericApprovalField {
  key: string;
  label: string;
  value: string;
}

export interface GenericApprovalContent {
  title: string;
  summary?: string;
  reference?: string;
  requester?: string;
  submittedAt?: string;
  fields: GenericApprovalField[];
}

export type TaskContentUnion =
  | { formKey: 'KOC_CANDIDATE_APPROVAL'; content: KocCandidateApprovalContent | null }
  | { formKey: 'KOC_DISCOVERY_DECISION'; content: KocDiscoveryDecisionContent | null }
  | { formKey: 'MANUAL_2FA_CONFIRMATION'; content: Manual2faConfirmationContent | null }
  | { formKey: 'APPROVAL'; content: GenericApprovalContent | null }
  | { formKey: string; content: null };

export type TypedUserTaskDetail =
  | (UserTaskDetail<KocCandidateApprovalContent> & { task: UserTaskSummary & { formKey: 'KOC_CANDIDATE_APPROVAL' } })
  | (UserTaskDetail<KocDiscoveryDecisionContent> & { task: UserTaskSummary & { formKey: 'KOC_DISCOVERY_DECISION' } })
  | (UserTaskDetail<Manual2faConfirmationContent> & { task: UserTaskSummary & { formKey: 'MANUAL_2FA_CONFIRMATION' } })
  | (UserTaskDetail<GenericApprovalContent> & { task: UserTaskSummary & { formKey: 'APPROVAL' } })
  | (UserTaskDetail<unknown> & { task: UserTaskSummary & { formKey: string } });
