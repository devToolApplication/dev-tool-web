import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { PermissionService } from '@core/auth/permission.service';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import type { KocCampaignDetail } from '../../model/koc-campaign.model';
import type { KocCandidateSummary } from '../../model/koc-candidate.model';
import type { KocDiscoveryStrategySummary } from '../../model/koc-discovery.model';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { KocDiscoveryApiService } from '../../services/koc-discovery-api.service';
import type { KocRealtimeEvent } from '../../services/koc-realtime.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';
import { CampaignDetailComponent } from './campaign-detail.component';

describe('CampaignDetailComponent', () => {
  let fixture: ComponentFixture<CampaignDetailComponent>;
  let component: CampaignDetailComponent;
  let campaignApi: { getCampaign: ReturnType<typeof vi.fn> };
  let discoveryApi: {
    getCampaignStrategies: ReturnType<typeof vi.fn>;
    startDiscoveryRun: ReturnType<typeof vi.fn>;
  };
  let candidateApi: { getCandidatePage: ReturnType<typeof vi.fn> };
  let realtimeApi: { connect: ReturnType<typeof vi.fn> };
  let realtimeEvents: Subject<KocRealtimeEvent>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let permissionService: { has: ReturnType<typeof vi.fn> };

  const campaign: KocCampaignDetail = {
    campaignId: 'campaign-1',
    name: 'Back to school',
    code: 'BTS',
    status: 'RUNNING',
    acceptedTarget: 10,
    version: 3,
    counters: {
      discovered: 120,
      unique: 90,
      screened: 60,
      rejected: 20,
      review: 5,
      accepted: 12,
      waiting: 4,
    },
    discoveryExecution: { agentCode: 'facebook-discovery', provider: 'codex' },
    searchStrategies: [
      {
        strategyId: 'strategy-1',
        name: 'Parent groups',
        enabled: true,
        priority: 1,
        keywords: ['school'],
        maxQueries: 5,
        maxCandidates: 40,
      },
    ],
    screeningRules: [],
    topRejectionReasons: [{ reason: 'Low engagement', count: 8 }],
  };

  const strategies: KocDiscoveryStrategySummary[] = [
    {
      strategyId: 'strategy-1',
      name: 'Parent groups',
      runs: 3,
      found: 80,
      newCandidates: 8,
      duplicateCandidates: 60,
      yieldRate: 0.1,
      status: 'RUNNING',
    },
  ];

  const candidate: KocCandidateSummary = {
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    displayName: 'Parent creator',
    decision: 'REJECTED',
    executionStatus: 'COMPLETED',
    followers: 900,
    screeningProgress: 100,
    reason: 'Low engagement',
    updatedAt: '2026-08-23T08:00:00Z',
  };

  beforeEach(() => {
    realtimeEvents = new Subject<KocRealtimeEvent>();
    campaignApi = { getCampaign: vi.fn(() => of(campaign)) };
    discoveryApi = {
      getCampaignStrategies: vi.fn(() => of(strategies)),
      startDiscoveryRun: vi.fn(() =>
        of({
          workflowRunId: 'workflow-run-1',
          workflowId: 'workflow-1',
          strategyId: 'strategy-1',
          status: 'RUNNING',
        }),
      ),
    };
    candidateApi = {
      getCandidatePage: vi.fn(() => of(createBasePageResponse([candidate], 0, 5, 1))),
    };
    realtimeApi = { connect: vi.fn(() => realtimeEvents.asObservable()) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    permissionService = { has: vi.fn((perm: string) => perm === 'AI_AGENT_WORKFLOW_WRITE') };

    TestBed.configureTestingModule({
      declarations: [CampaignDetailComponent, TranslateContentPipe],
      providers: [
        { provide: KocCampaignApiService, useValue: campaignApi },
        { provide: KocDiscoveryApiService, useValue: discoveryApi },
        { provide: KocCandidateApiService, useValue: candidateApi },
        { provide: KocRealtimeService, useValue: realtimeApi },
        { provide: PermissionService, useValue: permissionService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ campaignId: 'campaign-1' }),
              queryParamMap: convertToParamMap({ tab: 'overview' }),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CampaignDetailComponent);
    component = fixture.componentInstance;
  });

  it('loads campaign runtime overview, discovery efficiency and candidates from REST', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(campaignApi.getCampaign).toHaveBeenCalledWith('campaign-1');
    expect(discoveryApi.getCampaignStrategies).toHaveBeenCalledWith('campaign-1');
    expect(candidateApi.getCandidatePage).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      page: 0,
      size: 5,
    });
    expect(component.campaign()).toEqual(campaign);
    expect(component.funnelItems().map((item) => item.key)).toEqual([
      'discovered',
      'unique',
      'screened',
      'rejected',
      'review',
      'accepted',
      'waiting',
    ]);
    expect(component.topRejectionReasons()).toEqual([{ reason: 'Low engagement', count: 8 }]);
  });

  it('flags low-yield discovery strategies', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.isLowYield(strategies[0])).toBe(true);
  });

  it('starts a discovery strategy run and reloads campaign runtime', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(campaignApi.getCampaign).toHaveBeenCalledTimes(1);

    await component.startDiscoveryStrategy(strategies[0]);

    expect(discoveryApi.startDiscoveryRun).toHaveBeenCalledWith('campaign-1', 'strategy-1');
    expect(campaignApi.getCampaign).toHaveBeenCalledTimes(2);
  });

  it('refreshes campaign runtime when realtime event targets this campaign', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    realtimeEvents.next({ type: 'campaign.counters', aggregateId: 'campaign-1', version: 4 });
    await fixture.whenStable();

    expect(realtimeApi.connect).toHaveBeenCalledWith({ reconnect: true });
    expect(campaignApi.getCampaign).toHaveBeenCalledTimes(2);
  });

  it('drills down from funnel and rejection reasons to filtered candidates', () => {
    component.openFunnelFilter('rejected');
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/candidates'], {
      queryParams: { campaignId: 'campaign-1', decision: 'REJECTED' },
    });

    component.openRejectionReason('Low engagement');
    expect(router.navigate).toHaveBeenLastCalledWith(['/ai-agent-mcrs/koc/candidates'], {
      queryParams: {
        campaignId: 'campaign-1',
        decision: 'REJECTED',
        rejectReason: 'Low engagement',
      },
    });
  });

  it('wires detail tabs to a selected tab panel for assistive technology', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const tablist = nativeElement.querySelector('[role="tablist"]');
    const selectedTab = nativeElement.querySelector('[role="tab"][aria-selected="true"]');
    const controlledPanelId = selectedTab?.getAttribute('aria-controls');

    expect(tablist).toBeTruthy();
    expect(selectedTab?.id).toBe('campaign-detail-tab-overview');
    expect(controlledPanelId).toBe('campaign-detail-tabpanel-overview');
    expect(nativeElement.querySelector(`#${controlledPanelId}`)?.getAttribute('role')).toBe(
      'tabpanel',
    );
    expect(
      nativeElement.querySelector(`#${controlledPanelId}`)?.getAttribute('aria-labelledby'),
    ).toBe(selectedTab?.id);
  });

  it('does not expose edit campaign navigation in the runtime view', () => {
    expect('editCampaign' in (component as unknown as Record<string, unknown>)).toBe(false);
  });
});
