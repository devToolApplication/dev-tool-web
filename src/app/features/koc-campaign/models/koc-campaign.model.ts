export interface KocCampaignItem {
  id: string;
  name: string;
  niche?: string;
  targetCount?: number;
  minScore?: number;
  searchPrompt?: string;
  reviewPrompt?: string;
  workflowDefId?: string;
  workflowRunId?: string;
  workflowStatus?: string;
  approvedKocCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KocCampaignCreateRequest {
  name: string;
  niche?: string;
  targetCount?: number;
  minScore?: number;
  searchPrompt?: string;
  reviewPrompt?: string;
}

export interface KocCampaignUpdateRequest {
  name?: string;
  niche?: string;
  targetCount?: number;
  minScore?: number;
  searchPrompt?: string;
  reviewPrompt?: string;
  workflowStatus?: string;
  status?: string;
}

export interface KocCampaignQueryParams {
  page?: number;
  size?: number;
  niche?: string;
  workflowStatus?: string;
  status?: string;
  keyword?: string;
}

export interface KocCandidateItem {
  id: string;
  campaignId: string;
  externalProfileId: string;
  fullName?: string;
  profileUrl?: string;
  platform?: string;
  followerCount?: number;
  engagementRate?: number;
  score?: number;
  isQualified?: boolean;
  reviewNotes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KocCandidateAnalysis {
  strengths?: string[];
  weaknesses?: string[];
  matchReason?: string;
}

export interface KocCandidateApprovalItem {
  externalProfileId?: string;
  fullName?: string;
  profileUrl?: string;
  platform?: string;
  followerCount?: number;
  engagementRate?: number;
  score?: number;
  analysis?: KocCandidateAnalysis;
  selected?: boolean;
}

export interface WorkflowTask {
  id: string;
  name: string;
  taskDefinitionKey?: string;
  processInstanceId: string;
  processDefinitionId?: string;
  assignee?: string | null;
  createTime?: string;
  variables?: Record<string, unknown>;
}
