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
  currentStep?: string;
  currentStepTitle?: string;
  currentRound?: number;
  maxRounds?: number;
  stepDetail?: string;
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

export interface KocCampaignCloneRequest {
  name?: string;
  description?: string;
  niche?: string;
  targetCount?: number;
  minScore?: number;
  searchBatchSize?: number;
  maxSearchRounds?: number;
  searchPrompt?: string;
  reviewPrompt?: string;
  workflowDefinitionId?: string;
  approverAssignee?: string;
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
