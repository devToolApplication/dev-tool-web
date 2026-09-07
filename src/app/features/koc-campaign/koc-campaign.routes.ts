import { Routes } from '@angular/router';
import { KocCampaignListComponent } from './pages/koc-campaign-list/koc-campaign-list.component';
import { KocCandidateApprovalComponent } from './pages/koc-candidate-approval/koc-candidate-approval.component';

export const kocCampaignRoutes: Routes = [
  {
    path: 'koc/campaigns',
    component: KocCampaignListComponent,
    title: 'kocCampaign.title',
  },
  {
    path: 'koc/approval',
    component: KocCandidateApprovalComponent,
    title: 'kocApproval.title',
  },
];
