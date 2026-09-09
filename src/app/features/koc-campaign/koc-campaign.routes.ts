import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { KocCampaignListComponent } from './pages/koc-campaign-list/koc-campaign-list.component';

export const legacyKocApprovalRedirect: RedirectFunction = ({ queryParams }) => {
  const router = inject(Router);
  const taskId = queryParams['taskId'];
  if (typeof taskId === 'string' && taskId.length > 0) {
    return router.createUrlTree(['/tasks', taskId]);
  }

  const campaignId = queryParams['campaignId'];
  if (typeof campaignId === 'string' && campaignId.length > 0) {
    return router.createUrlTree(['/tasks'], {
      queryParams: { businessKey: campaignId },
    });
  }

  return router.createUrlTree(['/tasks']);
};

export const kocCampaignRoutes: Routes = [
  {
    path: 'koc/campaigns',
    component: KocCampaignListComponent,
    title: 'kocCampaign.title',
  },
  {
    path: 'koc/approval',
    redirectTo: legacyKocApprovalRedirect,
  },
];
