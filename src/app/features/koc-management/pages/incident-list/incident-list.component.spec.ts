import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import type { KocIncidentSummary } from '../../model/koc-incident.model';
import { KocIncidentApiService } from '../../services/koc-incident-api.service';
import { IncidentListComponent } from './incident-list.component';

describe('IncidentListComponent', () => {
  let fixture: ComponentFixture<IncidentListComponent>;
  let component: IncidentListComponent;
  let api: { getIncidentPage: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const incident: KocIncidentSummary = {
    incidentId: 'incident-1',
    dependencyKey: 'facebook-mcp-auth',
    status: 'BLOCKED',
    health: 'UNHEALTHY',
    waitingWorkflows: 128,
    affectedCampaigns: 4,
    agentCode: 'facebook-discovery',
    provider: 'codex',
  };

  beforeEach(() => {
    api = { getIncidentPage: vi.fn(() => of(createBasePageResponse([incident], 0, 20, 1))) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [IncidentListComponent],
      providers: [
        { provide: KocIncidentApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ status: 'BLOCKED' }) } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(IncidentListComponent);
    component = fixture.componentInstance;
  });

  it('loads active incidents and exposes one feature-level banner', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getIncidentPage).toHaveBeenCalledWith({ status: 'BLOCKED', page: 0, size: 20 });
    expect(component.incidents()).toEqual([incident]);
    expect(component.activeBanner()).toEqual(incident);
  });

  it('opens incident detail instead of retrying candidates one by one', () => {
    component.openIncident(incident);

    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/incidents', 'incident-1']);
  });
});
