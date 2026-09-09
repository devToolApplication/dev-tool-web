import { TestBed } from '@angular/core/testing';
import { RedirectFunction, Router, UrlTree } from '@angular/router';
import { KocCampaignListComponent } from './pages/koc-campaign-list/koc-campaign-list.component';
import { kocCampaignRoutes, legacyKocApprovalRedirect } from './koc-campaign.routes';

describe('kocCampaignRoutes', () => {
  const redirectedTree = {} as UrlTree;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = {
      createUrlTree: vi.fn().mockReturnValue(redirectedTree),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
  });

  it('keeps the campaign list route and legacy approval redirect', () => {
    expect(kocCampaignRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'koc/campaigns',
          component: KocCampaignListComponent,
        }),
        expect.objectContaining({
          path: 'koc/approval',
          redirectTo: legacyKocApprovalRedirect,
        }),
      ]),
    );
  });

  it('redirects a taskId deep link to its task host', () => {
    runRedirect({ taskId: 'task-123', campaignId: 'campaign-ignored' });

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tasks', 'task-123']);
  });

  it('redirects a campaignId deep link to the filtered task inbox', () => {
    runRedirect({ campaignId: 'campaign-123' });

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tasks'], {
      queryParams: { businessKey: 'campaign-123' },
    });
  });

  it('redirects an unscoped legacy link to the task inbox', () => {
    runRedirect({});

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tasks']);
  });

  function runRedirect(queryParams: Record<string, string>): UrlTree {
    const redirect = legacyKocApprovalRedirect as RedirectFunction;
    return TestBed.runInInjectionContext(() =>
      redirect({ queryParams } as Parameters<RedirectFunction>[0]),
    ) as UrlTree;
  }
});
