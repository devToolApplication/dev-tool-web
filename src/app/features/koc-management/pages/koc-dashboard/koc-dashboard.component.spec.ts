import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';

import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import {
  KocDashboardApiService,
  type KocDashboardData,
} from '../../services/koc-dashboard-api.service';
import type { KocRealtimeEvent } from '../../services/koc-realtime.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';
import { KocDashboardComponent } from './koc-dashboard.component';

describe('KocDashboardComponent', () => {
  let fixture: ComponentFixture<KocDashboardComponent>;
  let component: KocDashboardComponent;
  let dashboardApi: { getDashboard: ReturnType<typeof vi.fn> };
  let realtimeApi: { connect: ReturnType<typeof vi.fn> };
  let realtimeEvents: Subject<KocRealtimeEvent>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  const dashboard: KocDashboardData = {
    summary: {
      runningCampaigns: 1,
      acceptedCandidates: 2,
      pendingReviews: 3,
      waitingCandidates: 4,
      activeIncidents: 0,
    },
    campaignProgress: [],
    dependencyHealth: [],
    attentionItems: [],
  };

  beforeEach(() => {
    realtimeEvents = new Subject<KocRealtimeEvent>();
    dashboardApi = { getDashboard: vi.fn(() => of(dashboard)) };
    realtimeApi = { connect: vi.fn(() => realtimeEvents.asObservable()) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [KocDashboardComponent, TranslateContentPipe],
      providers: [
        { provide: KocDashboardApiService, useValue: dashboardApi },
        { provide: KocRealtimeService, useValue: realtimeApi },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(KocDashboardComponent);
    component = fixture.componentInstance;
  });

  it('loads dashboard REST data and subscribes to KOC realtime refresh events', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(1);
    expect(realtimeApi.connect).toHaveBeenCalledWith({ reconnect: true });
    expect(component.dashboard()).toEqual(dashboard);

    realtimeEvents.next({
      type: 'campaign.counters',
      aggregateId: 'campaign-1',
      version: 2,
      payload: { accepted: 2 },
    });
    await fixture.whenStable();

    expect(dashboardApi.getDashboard).toHaveBeenCalledTimes(2);
    expect(component.realtimeConnected()).toBe(true);
  });
});
