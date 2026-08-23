import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type { KocAgentCatalogItem, KocAgentProviderOption } from '../../model/koc-agent.model';
import type { KocAiExecutionConfig, KocHealthStatus, KocProvider } from '../../model/koc-common.model';

type KocSelectValue = string | number | boolean | null;

interface KocSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-agent-provider-selector',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-provider-selector.component.html',
  styleUrl: './agent-provider-selector.component.css',
})
export class AgentProviderSelectorComponent {
  @Input() agents: KocAgentCatalogItem[] = [];
  @Input() value: KocAiExecutionConfig | null = null;
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() valueChange = new EventEmitter<KocAiExecutionConfig>();

  get agentOptions(): KocSelectOption[] {
    return this.agents.map((agent) => ({
      label: agent.displayName,
      value: agent.agentCode,
      disabled: this.disabled,
    }));
  }

  get selectedAgent(): KocAgentCatalogItem | undefined {
    return this.agents.find((agent) => agent.agentCode === this.value?.agentCode);
  }

  get providerOptions(): KocSelectOption[] {
    return (this.selectedAgent?.supportedProviders ?? []).map((provider) => ({
      label: this.providerLabel(provider.provider),
      value: provider.provider,
      disabled: !provider.available && !this.isReadonlyPersistedProvider(provider.provider),
    }));
  }

  get providerStates(): KocAgentProviderOption[] {
    return this.selectedAgent?.supportedProviders ?? [];
  }

  onAgentChange(agentCode: KocSelectValue): void {
    if (typeof agentCode !== 'string') {
      return;
    }

    const selectedAgent = this.agents.find((agent) => agent.agentCode === agentCode);
    const provider = selectedAgent?.supportedProviders.find((option) => option.available)?.provider;

    this.value = { agentCode, provider };
    this.valueChange.emit(this.value);
  }

  onProviderChange(provider: KocProvider): void {
    if (!this.value || this.disabled || this.readonly || this.isProviderDisabled(provider)) {
      return;
    }

    this.value = { ...this.value, provider };
    this.valueChange.emit(this.value);
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

  isProviderChecked(provider: KocProvider): boolean {
    return this.value?.provider === provider;
  }

  isProviderDisabled(provider: KocProvider): boolean {
    return this.providerOptions.find((option) => option.value === provider)?.disabled ?? true;
  }

  private isReadonlyPersistedProvider(provider: KocProvider): boolean {
    return this.readonly && this.value?.provider === provider;
  }
}
