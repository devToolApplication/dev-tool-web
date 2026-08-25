import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import type { KocIncidentDetail, KocRecoveryProgress } from '../../model/koc-incident.model';
import { KocIncidentApiService } from '../../services/koc-incident-api.service';
import type { KocRealtimeEvent } from '../../services/koc-realtime.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';
import { IncidentDetailComponent } from './incident-detail.component';

describe('IncidentDetailComponent', () => {
  let fixture: ComponentFixture<IncidentDetailComponent>;
  let component: IncidentDetailComponent;
  let api: {
    getIncident: ReturnType<typeof vi.fn>;
    testDependency: ReturnType<typeof vi.fn>;
    markIssueFixed: ReturnType<typeof vi.fn>;
  };
  let realtimeApi: { connect: ReturnType<typeof vi.fn> };
  let realtimeEvents: Subject<KocRealtimeEvent>;
  let permissionService: { hasAny: ReturnType<typeof vi.fn> };

  const incident: KocIncidentDetail = {
    incidentId: 'incident-1',
    dependencyKey: 'facebook-mcp-auth',
    stableErrorCode: 'FB_MCP_AUTH_EXPIRED',
    status: 'BLOCKED',
    health: 'UNHEALTHY',
    waitingWorkflows: 128,
    affectedCampaigns: 4,
    businessImpact: 'New dependent tasks are paused.',
    affectedProviders: ['codex'],
    agentCode: 'facebook-discovery',
    provider: 'codex',
  };
  const progress: KocRecoveryProgress = {
    recovered: 10,
    running: 5,
    queued: 113,
    failed: 0,
  };

  beforeEach(() => {
    realtimeEvents = new Subject<KocRealtimeEvent>();
    api = {
      getIncident: vi.fn(() => of(incident)),
      testDependency: vi.fn(() => of({ ...incident, status: 'RECOVERING', health: 'DEGRADED' })),
      markIssueFixed: vi.fn(() => of(progress)),
    };
    realtimeApi = { connect: vi.fn(() => realtimeEvents.asObservable()) };
    permissionService = { hasAny: vi.fn(() => true) };

    TestBed.configureTestingModule({
      declarations: [IncidentDetailComponent],
      providers: [
        { provide: KocIncidentApiService, useValue: api },
        { provide: KocRealtimeService, useValue: realtimeApi },
        { provide: PermissionService, useValue: permissionService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ incidentId: 'incident-1' }) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(IncidentDetailComponent);
    component = fixture.componentInstance;
  });

  it('loads incident detail with stable error code and recovery impact', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getIncident).toHaveBeenCalledWith('incident-1');
    expect(component.incident()).toEqual(incident);
    expect(component.impactItems().map((item) => item.label)).toEqual([
      'koc.incident.detail.dependencyKey',
      'koc.incident.detail.errorCode',
      'koc.incident.detail.waitingWorkflows',
      'koc.incident.detail.affectedCampaigns',
    ]);
  });

  it('marks issue fixed once and shows automatic recovery progress', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.markIssueFixed();

    expect(api.markIssueFixed).toHaveBeenCalledWith('incident-1');
    expect(component.recoveryProgress()).toEqual(progress);
    expect(component.recoveryItems().map((item) => item.value)).toEqual([10, 5, 113, 0]);
  });

  it('refreshes incident detail when realtime event targets this incident', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    realtimeEvents.next({ type: 'incident.status', aggregateId: 'incident-1', version: 2 });
    await fixture.whenStable();

    expect(realtimeApi.connect).toHaveBeenCalledWith({ reconnect: true });
    expect(api.getIncident).toHaveBeenCalledTimes(2);
  });

  it('refreshes incident detail when recovery event targets its dependency', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    realtimeEvents.next({
      type: 'dependency.recovery',
      aggregateId: 'facebook-mcp-auth',
      version: 2,
    });
    await fixture.whenStable();

    expect(api.getIncident).toHaveBeenCalledTimes(2);
  });

  it('disables and no-ops testDependency and markIssueFixed when operator permissions are missing', async () => {
    permissionService.hasAny.mockReturnValue(false);
    expect(component.canOperate()).toBe(false);

    await component.testDependency();
    expect(api.testDependency).not.toHaveBeenCalled();

    await component.markIssueFixed();
    expect(api.markIssueFixed).not.toHaveBeenCalled();
  });
});
