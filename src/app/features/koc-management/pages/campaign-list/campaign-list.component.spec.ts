import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { PermissionService } from '@core/auth/permission.service';
import type { KocCampaignSummary } from '../../model/koc-campaign.model';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';
import { CampaignListComponent } from './campaign-list.component';

describe('CampaignListComponent', () => {
  let fixture: ComponentFixture<CampaignListComponent>;
  let component: CampaignListComponent;
  let api: {
    getCampaignPage: ReturnType<typeof vi.fn>;
    startCampaign: ReturnType<typeof vi.fn>;
    pauseCampaign: ReturnType<typeof vi.fn>;
    resumeCampaign: ReturnType<typeof vi.fn>;
    cloneCampaign: ReturnType<typeof vi.fn>;
    stopCampaign: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let permissionService: { has: ReturnType<typeof vi.fn> };

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
      startCampaign: vi.fn(() => of(row)),
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
    permissionService = {
      has: vi.fn((perm: string) => perm === 'AI_AGENT_WORKFLOW_WRITE'),
    };

    TestBed.configureTestingModule({
      declarations: [CampaignListComponent],
      providers: [
        { provide: KocCampaignApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: PermissionService, useValue: permissionService },
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

  it('handles row actions: open and edit navigate to campaign detail', () => {
    component.onTableAction({
      action: { id: 'open', label: 'open', onClick: vi.fn() },
      row,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/campaigns', 'campaign-1']);

    component.onTableAction({
      action: { id: 'edit', label: 'edit', onClick: vi.fn() },
      row,
    });
    expect(router.navigate).toHaveBeenLastCalledWith(['/ai-agent-mcrs/koc/campaigns', 'campaign-1']);
  });

  it('runs lifecycle actions (start, pause, resume, clone, stop) and preserves page and filters upon reload', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.query.set({ search: 'school', status: 'RUNNING', page: 2, size: 25 });
    component.metadata.set({
      currentPage: 2,
      pageNumber: 2,
      size: 25,
      pageSize: 25,
      totalElements: 100,
      totalPages: 4,
    });

    component.onTableAction({
      action: { id: 'start', label: 'start', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();
    expect(api.startCampaign).toHaveBeenCalledWith('campaign-1');
    expect(api.getCampaignPage).toHaveBeenLastCalledWith({
      search: 'school',
      status: 'RUNNING',
      page: 2,
      size: 25,
    });

    component.onTableAction({
      action: { id: 'pause', label: 'pause', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();
    expect(api.pauseCampaign).toHaveBeenCalledWith('campaign-1');

    component.onTableAction({
      action: { id: 'resume', label: 'resume', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();
    expect(api.resumeCampaign).toHaveBeenCalledWith('campaign-1');

    component.onTableAction({
      action: { id: 'clone', label: 'clone', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();
    expect(api.cloneCampaign).toHaveBeenCalledWith('campaign-1');

    component.onTableAction({
      action: { id: 'stop', label: 'stop', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();
    expect(api.stopCampaign).toHaveBeenCalledWith('campaign-1');
  });

  it('prevents mutating lifecycle actions if user lacks workflow write permission', async () => {
    permissionService.has.mockReturnValue(false);
    fixture.detectChanges();
    await fixture.whenStable();

    component.onTableAction({
      action: { id: 'start', label: 'start', onClick: vi.fn() },
      row,
    });
    component.onTableAction({
      action: { id: 'pause', label: 'pause', onClick: vi.fn() },
      row,
    });
    component.onTableAction({
      action: { id: 'resume', label: 'resume', onClick: vi.fn() },
      row,
    });
    component.onTableAction({
      action: { id: 'clone', label: 'clone', onClick: vi.fn() },
      row,
    });
    component.onTableAction({
      action: { id: 'stop', label: 'stop', onClick: vi.fn() },
      row,
    });
    await fixture.whenStable();

    expect(api.startCampaign).not.toHaveBeenCalled();
    expect(api.pauseCampaign).not.toHaveBeenCalled();
    expect(api.resumeCampaign).not.toHaveBeenCalled();
    expect(api.cloneCampaign).not.toHaveBeenCalled();
    expect(api.stopCampaign).not.toHaveBeenCalled();
  });
});
