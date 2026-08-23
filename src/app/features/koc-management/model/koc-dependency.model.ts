import type { KocHealthStatus } from './koc-common.model';

export interface KocDependencyHealth {
  dependencyKey: string;
  displayName: string;
  health: KocHealthStatus;
  stableErrorCode?: string;
  affectedAgents: string[];
  affectedProviders: string[];
}
