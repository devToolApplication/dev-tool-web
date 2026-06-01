import { AiAgentCrawlerConfigRequest } from '../../../../core/models/ai-agent/ai-agent-crawler.model';

export const AI_AGENT_CRAWLER_ROUTES = {
  list: '/admin/ai-agent/crawlers',
  create: '/admin/ai-agent/crawlers/create'
} as const;

export const AI_AGENT_CRAWLER_INITIAL_VALUE: AiAgentCrawlerConfigRequest = {
  name: '',
  crawlerType: 'WEB',
  configJson: '{}',
  timeoutSeconds: 60,
  description: '',
  status: 'ENABLED'
};
