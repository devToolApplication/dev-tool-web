import type { KocHealthStatus, KocProvider } from './koc-common.model';

export type KocAgentCapability = 'DISCOVERY' | 'SCREENING' | 'REVIEW' | 'INCIDENT_RECOVERY';

export interface KocAgentProviderOption {
  provider: KocProvider;
  available: boolean;
  health: KocHealthStatus;
}

export interface KocAgentCatalogItem {
  agentCode: string;
  displayName: string;
  capability: KocAgentCapability;
  supportedProviders: KocAgentProviderOption[];
  requiredDependencies: string[];
  health: KocHealthStatus;
}
