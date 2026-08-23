import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import type { KocCampaignSummary } from '../../model/koc-campaign.model';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';
import { CampaignListComponent } from './campaign-list.component';

describe('CampaignListComponent', () => {
  let fixture: ComponentFixture<CampaignListComponent>;
  let component: CampaignListComponent;
  let api: {
    getCampaignPage: ReturnType<typeof vi.fn>;
    pauseCampaign: ReturnType<typeof vi.fn>;
    resumeCampaign: ReturnType<typeof vi.fn>;
    cloneCampaign: ReturnType<typeof vi.fn>;
    stopCampaign: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

  const row: KocCampaignSummary = {
    campaignId: 'campaign-1',
    name: 'Back to school',
    code: 'BTS',
    status: 'RUNNING',
    acceptedTarget: 10,
    counters: {
      discovered: 20,
      unique: 18,
      screened: 12,
      rejected: 2,
      review: 1,
      accepted: 6,
      waiting: 3,
    },
    lastActivityAt: '2026-08-23T08:00:00Z',
  };

  beforeEach(() => {
    api = {
      getCampaignPage: vi.fn(() => of(createBasePageResponse([row], 2, 25, 1))),
      pauseCampaign: vi.fn(() => of(row)),
      resumeCampaign: vi.fn(() => of(row)),
      cloneCampaign: vi.fn(() => of(row)),
      stopCampaign: vi.fn(() => of(row)),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    route = {
      snapshot: {
        queryParamMap: convertToParamMap({
          search: 'school',
          status: 'RUNNING',
          page: '2',
          size: '25',
        }),
      },
    };

    TestBed.configureTestingModule({
      declarations: [CampaignListComponent],
      providers: [
        { provide: KocCampaignApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CampaignListComponent);
    component = fixture.componentInstance;
  });

  it('initializes filters from the URL and loads campaigns', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getCampaignPage).toHaveBeenCalledWith({
      search: 'school',
      status: 'RUNNING',
      page: 2,
      size: 25,
    });
    expect(component.campaigns()).toEqual([row]);
    expect(component.totalRecords()).toBe(1);
  });

  it('writes search and status filters back to the URL', () => {
    component.query.set({ search: 'school', status: 'RUNNING', page: 2, size: 25 });

    component.onSearch({ search: 'math' });
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { search: 'math', status: 'RUNNING', page: 0, size: 25 },
    });

    component.onStatusFilter('PAUSED');
    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: route,
      queryParams: { search: 'math', status: 'PAUSED', page: 0, size: 25 },
    });
  });

  it('opens campaign detail when a row is clicked', () => {
    component.openCampaign(row);

    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/campaigns', 'campaign-1']);
  });
});
