import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { AgentProviderSelectorComponent } from './components/agent-provider-selector/agent-provider-selector.component';
import { KocNavigationComponent } from './components/koc-navigation/koc-navigation.component';
import { KocPageFrameComponent } from './components/koc-page-frame/koc-page-frame.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { CampaignDetailComponent } from './pages/campaign-detail/campaign-detail.component';
import { CampaignEditorComponent } from './pages/campaign-editor/campaign-editor.component';
import { CampaignListComponent } from './pages/campaign-list/campaign-list.component';
import { CampaignReviewComponent } from './pages/campaign-review/campaign-review.component';
import { CandidateDetailComponent } from './pages/candidate-detail/candidate-detail.component';
import { CandidateListComponent } from './pages/candidate-list/candidate-list.component';
import { IncidentDetailComponent } from './pages/incident-detail/incident-detail.component';
import { IncidentListComponent } from './pages/incident-list/incident-list.component';
import { KocDashboardComponent } from './pages/koc-dashboard/koc-dashboard.component';
import { KocRoutePlaceholderComponent } from './pages/koc-route-placeholder/koc-route-placeholder.component';
import { ReviewDetailComponent } from './pages/review-detail/review-detail.component';
import { ReviewQueueComponent } from './pages/review-queue/review-queue.component';
import { AgentCatalogComponent } from './pages/agent-catalog/agent-catalog.component';
import { WorkflowTemplateListComponent } from './pages/workflow-template-list/workflow-template-list.component';
import { ScreeningTemplateListComponent } from './pages/screening-template-list/screening-template-list.component';

const KOC_MANAGEMENT_COMPONENTS = [
  AgentProviderSelectorComponent,
  KocNavigationComponent,
  KocPageFrameComponent,
  StatusBadgeComponent,
  CampaignDetailComponent,
  CampaignEditorComponent,
  CampaignListComponent,
  CampaignReviewComponent,
  CandidateDetailComponent,
  CandidateListComponent,
  IncidentDetailComponent,
  IncidentListComponent,
  KocDashboardComponent,
  KocRoutePlaceholderComponent,
  ReviewDetailComponent,
  ReviewQueueComponent,
  AgentCatalogComponent,
  WorkflowTemplateListComponent,
  ScreeningTemplateListComponent,
];

@NgModule({
  declarations: KOC_MANAGEMENT_COMPONENTS,
  imports: [CommonModule, RouterModule, SharedModule],
})
export class KocManagementModule {}
