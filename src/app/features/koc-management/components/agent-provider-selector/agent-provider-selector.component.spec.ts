import type { KocAgentCatalogItem } from '../../model/koc-agent.model';
import { AgentProviderSelectorComponent } from './agent-provider-selector.component';

describe('AgentProviderSelectorComponent', () => {
  const agents: KocAgentCatalogItem[] = [
    {
      agentCode: 'facebook-discovery',
      displayName: 'Facebook discovery',
      capability: 'DISCOVERY',
      supportedProviders: [
        { provider: 'codex', available: true, health: 'HEALTHY' },
        { provider: 'claude', available: false, health: 'UNHEALTHY' },
      ],
      requiredDependencies: ['facebook-mcp'],
      health: 'DEGRADED',
    },
  ];

  it('filters providers by selected agent and disables unavailable choices', () => {
    const component = new AgentProviderSelectorComponent();
    component.agents = agents;
    component.value = { agentCode: 'facebook-discovery', provider: 'codex' };

    expect(component.providerOptions).toEqual([
      {
        label: 'koc.provider.codex',
        value: 'codex',
        disabled: false,
      },
      {
        label: 'koc.provider.claude',
        value: 'claude',
        disabled: true,
      },
    ]);
  });

  it('preserves an already persisted unavailable provider in read-only history state', () => {
    const component = new AgentProviderSelectorComponent();
    component.agents = agents;
    component.readonly = true;
    component.value = { agentCode: 'facebook-discovery', provider: 'claude' };

    expect(component.providerOptions.find((option) => option.value === 'claude')).toEqual(
      expect.objectContaining({ disabled: false }),
    );
  });
});
