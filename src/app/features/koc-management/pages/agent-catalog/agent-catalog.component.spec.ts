import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import type { KocAgentCatalogItem } from '../../model/koc-agent.model';
import { KocAgentApiService } from '../../services/koc-agent-api.service';
import { AgentCatalogComponent } from './agent-catalog.component';

describe('AgentCatalogComponent', () => {
  let fixture: ComponentFixture<AgentCatalogComponent>;
  let component: AgentCatalogComponent;
  let agentApi: { getAgents: ReturnType<typeof vi.fn> };

  const mockAgents: KocAgentCatalogItem[] = [
    {
      agentCode: 'facebook-discovery',
      displayName: 'Facebook Discovery Agent',
      capability: 'DISCOVERY',
      supportedProviders: [
        { provider: 'codex', available: true, health: 'HEALTHY' },
        { provider: 'claude', available: false, health: 'UNHEALTHY' },
      ],
      requiredDependencies: ['facebook-graph-api', 'proxy-pool'],
      health: 'HEALTHY',
    },
    {
      agentCode: 'content-screening',
      displayName: 'Content Screening Agent',
      capability: 'SCREENING',
      supportedProviders: [
        { provider: 'claude', available: true, health: 'HEALTHY' },
      ],
      requiredDependencies: [],
      health: 'HEALTHY',
    },
  ];

  beforeEach(() => {
    agentApi = {
      getAgents: vi.fn(() => of(mockAgents)),
    };

    TestBed.configureTestingModule({
      declarations: [AgentCatalogComponent],
      providers: [{ provide: KocAgentApiService, useValue: agentApi }],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(AgentCatalogComponent);
    component = fixture.componentInstance;
  });

  it('loads agent catalog on init with capability, provider health, and dependencies only', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(agentApi.getAgents).toHaveBeenCalledTimes(1);
    expect(component.agents()).toEqual(mockAgents);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('maps capability and provider labels correctly', () => {
    expect(component.capabilityLabel('DISCOVERY')).toBe('koc.agent.capability.discovery');
    expect(component.capabilityLabel('SCREENING')).toBe('koc.agent.capability.screening');
    expect(component.capabilityLabel('REVIEW')).toBe('koc.agent.capability.review');
    expect(component.capabilityLabel('INCIDENT_RECOVERY')).toBe('koc.agent.capability.incidentRecovery');

    expect(component.providerLabel('codex')).toBe('koc.provider.codex');
    expect(component.providerLabel('claude')).toBe('koc.provider.claude');

    expect(component.providerHealthLabel('HEALTHY')).toBe('koc.provider.health.healthy');
    expect(component.providerHealthLabel('DEGRADED')).toBe('koc.provider.health.degraded');
    expect(component.providerHealthLabel('UNHEALTHY')).toBe('koc.provider.health.unhealthy');

    expect(component.providerHealthVariant('HEALTHY')).toBe('success');
    expect(component.providerHealthVariant('DEGRADED')).toBe('warning');
    expect(component.providerHealthVariant('UNHEALTHY')).toBe('danger');
  });

  it('handles load error gracefully', async () => {
    agentApi.getAgents.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadAgents();
    await fixture.whenStable();

    expect(component.agents()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Network error');
  });
});
