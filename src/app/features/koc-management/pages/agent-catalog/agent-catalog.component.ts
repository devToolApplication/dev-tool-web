import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type { KocAgentCapability, KocAgentCatalogItem } from '../../model/koc-agent.model';
import type { KocHealthStatus, KocProvider } from '../../model/koc-common.model';
import { KocAgentApiService } from '../../services/koc-agent-api.service';

@Component({
  selector: 'app-agent-catalog',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-catalog.component.html',
  styleUrl: './agent-catalog.component.css',
})
export class AgentCatalogComponent implements OnInit {
  private readonly agentApi = inject(KocAgentApiService);

  readonly agents = signal<KocAgentCatalogItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadAgents();
  }

  async loadAgents(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const agents = await firstValueFrom(this.agentApi.getAgents());
      this.agents.set(agents ?? []);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  capabilityLabel(capability: KocAgentCapability): string {
    switch (capability) {
      case 'DISCOVERY':
        return 'koc.agent.capability.discovery';
      case 'SCREENING':
        return 'koc.agent.capability.screening';
      case 'REVIEW':
        return 'koc.agent.capability.review';
      case 'INCIDENT_RECOVERY':
        return 'koc.agent.capability.incidentRecovery';
      default:
        return capability;
    }
  }

  providerLabel(provider: KocProvider): string {
    return `koc.provider.${provider}`;
  }

  providerHealthLabel(health: KocHealthStatus): string {
    return `koc.provider.health.${health.toLowerCase()}`;
  }

  providerHealthVariant(health: KocHealthStatus): BadgeVariant {
    switch (health) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'UNHEALTHY':
        return 'danger';
      default:
        return 'muted';
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.agentCatalog.error.loadFailed';
}
