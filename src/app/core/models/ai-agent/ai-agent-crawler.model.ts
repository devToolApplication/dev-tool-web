import { AiAgentFeatureStatus } from './ai-agent-model.model';

export type CrawlerType = 'WEB' | 'FILE' | 'ACTION_RESPONSE';

export interface AiAgentCrawlerConfigResponse {
  id: string;
  name: string;
  crawlerType: CrawlerType;
  configJson: string;
  timeoutSeconds: number;
  description?: string;
  status: AiAgentFeatureStatus;
}

export interface AiAgentCrawlerConfigRequest {
  name: string;
  crawlerType: CrawlerType;
  configJson: string;
  timeoutSeconds: number;
  description?: string;
  status: AiAgentFeatureStatus;
}

export interface AiAgentCrawlerTestRunRequest {
  inputJson: string;
  actorId: string;
}

export interface AiAgentCrawlerTestRunResponse {
  crawlerConfigId: string;
  success: boolean;
  previewJson: string;
  safeErrorCode?: string;
  safeErrorMessage?: string;
}
