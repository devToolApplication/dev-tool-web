import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { PermissionService } from '@core/auth/permission.service';
import type { KocAgentCatalogItem } from '../../model/koc-agent.model';
import type { KocCampaignDetail } from '../../model/koc-campaign.model';
import { createDefaultAiScreeningRule, createDefaultCodeScreeningRule } from '../../model/koc-campaign-wizard.model';
import { KocAgentApiService } from '../../services/koc-agent-api.service';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import { CampaignWizardComponent } from './campaign-wizard.component';

describe('CampaignWizardComponent', () => {
  let fixture: ComponentFixture<CampaignWizardComponent>;
  let component: CampaignWizardComponent;
  let campaignApi: {
    getCampaign: ReturnType<typeof vi.fn>;
    createCampaign: ReturnType<typeof vi.fn>;
    updateCampaign: ReturnType<typeof vi.fn>;
    startCampaign: ReturnType<typeof vi.fn>;
  };
  let agentApi: { getAgents: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let permissionService: { has: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };
  let route: { snapshot: { paramMap: ReturnType<typeof convertToParamMap>; data: Record<string, string> } };

  const agents: KocAgentCatalogItem[] = [
    {
      agentCode: 'facebook-discovery',
      displayName: 'Facebook discovery',
      capability: 'DISCOVERY',
      supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
      requiredDependencies: ['facebook-mcp'],
      health: 'HEALTHY',
    },
    {
      agentCode: 'engagement-research',
      displayName: 'Engagement research',
      capability: 'SCREENING',
      supportedProviders: [{ provider: 'claude', available: true, health: 'HEALTHY' }],
      requiredDependencies: ['facebook-mcp'],
      health: 'HEALTHY',
    },
  ];

  const saved: KocCampaignDetail = {
    campaignId: 'campaign-1',
    name: 'Back to school',
    code: 'BTS',
    status: 'DRAFT',
    acceptedTarget: 10,
    counters: {
      discovered: 0,
      unique: 0,
      screened: 0,
      rejected: 0,
      review: 0,
      accepted: 0,
      waiting: 0,
    },
    version: 1,
    discoveryExecution: { agentCode: 'facebook-discovery', provider: 'codex' },
  };

  beforeEach(() => {
    campaignApi = {
      getCampaign: vi.fn(() => of(saved)),
      createCampaign: vi.fn(() => of(saved)),
      updateCampaign: vi.fn(() => of(saved)),
      startCampaign: vi.fn(() => of({ ...saved, status: 'RUNNING' })),
    };
    agentApi = { getAgents: vi.fn(() => of(agents)) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    permissionService = { has: vi.fn((perm: string) => perm === 'AI_AGENT_WORKFLOW_WRITE') };
    toastService = { error: vi.fn() };
    route = {
      snapshot: {
        paramMap: convertToParamMap({}),
        data: { mode: 'create' },
      },
    };

    TestBed.configureTestingModule({
      declarations: [CampaignWizardComponent, TranslateContentPipe],
      providers: [
        { provide: KocCampaignApiService, useValue: campaignApi },
        { provide: KocAgentApiService, useValue: agentApi },
        { provide: PermissionService, useValue: permissionService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CampaignWizardComponent);
    component = fixture.componentInstance;
  });

  it('loads agents and initializes create mode with a default discovery strategy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(agentApi.getAgents).toHaveBeenCalled();
    expect(component.mode()).toBe('create');
    expect(component.draft().searchStrategies.length).toBeGreaterThan(0);
  });

  it('tracks dirty state and clears it after saving a draft', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateDraft({ name: 'Back to school', code: 'BTS', targetAccepted: 10, maximumDiscovered: 30, maximumScreened: 20 });
    component.updateDiscoveryExecution({ agentCode: 'facebook-discovery', provider: 'codex' });
    expect(component.hasUnsavedChanges()).toBe(true);

    await component.saveDraft();

    expect(campaignApi.createCampaign).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Back to school',
      discoveryExecution: { agentCode: 'facebook-discovery', provider: 'codex' },
    }));
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('keeps the wizard editable and shows a toast when saving fails', async () => {
    campaignApi.createCampaign.mockReturnValue(
      throwError(() => new Error('Missing AI_GATE agentCode')),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateDraft({ name: 'Back to school', code: 'BTS', targetAccepted: 10, maximumDiscovered: 30, maximumScreened: 20 });
    component.updateDiscoveryExecution({ agentCode: 'facebook-discovery', provider: 'codex' });

    const result = await component.saveDraft();

    expect(result).toBeNull();
    expect(component.error()).toBeNull();
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(toastService.error).toHaveBeenCalledWith('Missing AI_GATE agentCode');
  });

  it('starts a valid campaign after saving the draft', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateDraft({ name: 'Back to school', code: 'BTS', targetAccepted: 10, maximumDiscovered: 30, maximumScreened: 20 });
    component.updateDiscoveryExecution({ agentCode: 'facebook-discovery', provider: 'codex' });

    await component.startCampaign();

    expect(campaignApi.createCampaign).toHaveBeenCalled();
    expect(campaignApi.startCampaign).toHaveBeenCalledWith('campaign-1');
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/campaigns', 'campaign-1']);
  });

  it('adds and saves Phase 4 CODE and AI screening rules without runtime fields', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateDraft({ name: 'Back to school', code: 'BTS', targetAccepted: 10, maximumDiscovered: 30, maximumScreened: 20 });
    component.updateDiscoveryExecution({ agentCode: 'facebook-discovery', provider: 'codex' });
    component.addScreeningRule(createDefaultCodeScreeningRule('HARD_FILTERS', 1));
    component.addScreeningRule(createDefaultAiScreeningRule('ENGAGEMENT', 2));
    component.updateScreeningRule(1, { execution: { agentCode: 'engagement-research', provider: 'claude' } });

    await component.saveDraft();

    const payload = campaignApi.createCampaign.mock.calls[0][0];
    expect(payload.screeningRules).toEqual([
      expect.objectContaining({ kind: 'CODE', group: 'HARD_FILTERS', whenEvidenceMissing: 'CONTINUE' }),
      expect.objectContaining({
        kind: 'AI',
        group: 'ENGAGEMENT',
        execution: { agentCode: 'engagement-research', provider: 'claude' },
        whenEvidenceMissing: 'CONTINUE',
      }),
    ]);
    expect(JSON.stringify(payload)).not.toMatch(/modelProfile|reasoningEffort|mcpConfig|systemPrompt|runtimeHome/);
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('blocks start while an AI screening rule has no agent', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.updateDraft({ name: 'Back to school', code: 'BTS', targetAccepted: 10, maximumDiscovered: 30, maximumScreened: 20 });
    component.updateDiscoveryExecution({ agentCode: 'facebook-discovery', provider: 'codex' });
    component.addScreeningRule(createDefaultAiScreeningRule('ENGAGEMENT', 1));

    expect(component.startDisabled()).toBe(true);

    await component.startCampaign();

    expect(campaignApi.startCampaign).not.toHaveBeenCalled();
    expect(component.validationIssues().map((issue) => issue.key)).toContain('koc.campaignWizard.validation.screeningAiAgentRequired');
  });

  it('loads and updates an existing campaign in edit mode', async () => {
    route.snapshot.paramMap = convertToParamMap({ campaignId: 'campaign-1' });
    route.snapshot.data = { mode: 'edit' };

    fixture = TestBed.createComponent(CampaignWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(campaignApi.getCampaign).toHaveBeenCalledWith('campaign-1');

    component.updateDraft({ description: 'Updated' });
    await component.saveDraft();

    expect(campaignApi.updateCampaign).toHaveBeenCalledWith('campaign-1', expect.objectContaining({
      description: 'Updated',
    }));
  });

  it('disables saving and starting when AI_AGENT_WORKFLOW_WRITE is missing', async () => {
    permissionService.has.mockReturnValue(false);
    expect(component.canMutate()).toBe(false);
    expect(component.startDisabled()).toBe(true);

    const savedResult = await component.saveDraft();
    expect(savedResult).toBeNull();
    expect(campaignApi.createCampaign).not.toHaveBeenCalled();

    await component.startCampaign();
    expect(campaignApi.startCampaign).not.toHaveBeenCalled();
  });
});
