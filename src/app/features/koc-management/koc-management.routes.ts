import { Routes } from '@angular/router';
import { permissionGuard } from '@core/auth/permission.guard';
import { serviceManagementUnsavedChangesGuard } from '@features/service-management/guards/service-management-unsaved-changes.guard';
import { CampaignDetailComponent } from './pages/campaign-detail/campaign-detail.component';
import { CampaignListComponent } from './pages/campaign-list/campaign-list.component';
import { CampaignWizardComponent } from './pages/campaign-wizard/campaign-wizard.component';
import { CandidateDetailComponent } from './pages/candidate-detail/candidate-detail.component';
import { CandidateListComponent } from './pages/candidate-list/candidate-list.component';
import { ReviewDetailComponent } from './pages/review-detail/review-detail.component';
import { ReviewQueueComponent } from './pages/review-queue/review-queue.component';
import { IncidentDetailComponent } from './pages/incident-detail/incident-detail.component';
import { IncidentListComponent } from './pages/incident-list/incident-list.component';
import { KocDashboardComponent } from './pages/koc-dashboard/koc-dashboard.component';
import { AgentCatalogComponent } from './pages/agent-catalog/agent-catalog.component';
import { WorkflowTemplateListComponent } from './pages/workflow-template-list/workflow-template-list.component';
import { ScreeningTemplateListComponent } from './pages/screening-template-list/screening-template-list.component';

export const kocManagementRoutes: Routes = [
  {
    path: 'ai-agent-mcrs/koc',
    pathMatch: 'full',
    redirectTo: 'ai-agent-mcrs/koc/dashboard',
  },
  {
    path: 'ai-agent-mcrs/koc/dashboard',
    component: KocDashboardComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
    },
  },
  {
    path: 'ai-agent-mcrs/koc/campaigns',
    component: CampaignListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
    },
  },
  {
    path: 'ai-agent-mcrs/koc/campaigns/create',
    component: CampaignWizardComponent,
    canActivate: [permissionGuard],
    canDeactivate: [serviceManagementUnsavedChangesGuard],
    data: {
      permissions: ['AI_AGENT_WORKFLOW_WRITE'],
      mode: 'create',
      title: 'koc.campaigns.create.title',
      subtitle: 'koc.campaigns.create.subtitle',
      sectionTitle: 'koc.campaigns.create.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/campaigns/:campaignId',
    component: CampaignDetailComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.campaigns.detail.title',
      subtitle: 'koc.campaigns.detail.subtitle',
      sectionTitle: 'koc.campaigns.detail.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/campaigns/:campaignId/edit',
    component: CampaignWizardComponent,
    canActivate: [permissionGuard],
    canDeactivate: [serviceManagementUnsavedChangesGuard],
    data: {
      permissions: ['AI_AGENT_WORKFLOW_WRITE'],
      mode: 'edit',
      title: 'koc.campaigns.edit.title',
      subtitle: 'koc.campaigns.edit.subtitle',
      sectionTitle: 'koc.campaigns.edit.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/candidates',
    component: CandidateListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.candidates.title',
      subtitle: 'koc.candidates.subtitle',
      sectionTitle: 'koc.candidates.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/candidates/:candidateId',
    component: CandidateDetailComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.candidates.detail.title',
      subtitle: 'koc.candidates.detail.subtitle',
      sectionTitle: 'koc.candidates.detail.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/reviews',
    component: ReviewQueueComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.reviews.title',
      subtitle: 'koc.reviews.subtitle',
      sectionTitle: 'koc.reviews.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/reviews/:reviewId',
    component: ReviewDetailComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_WORKFLOW_REVIEW', 'AI_AGENT_WORKFLOW_WRITE'],
      permissionsMode: 'any',
      title: 'koc.reviews.detail.title',
      subtitle: 'koc.reviews.detail.subtitle',
      sectionTitle: 'koc.reviews.detail.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/incidents',
    component: IncidentListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.incidents.title',
      subtitle: 'koc.incidents.subtitle',
      sectionTitle: 'koc.incidents.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/incidents/:incidentId',
    component: IncidentDetailComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.incidents.detail.title',
      subtitle: 'koc.incidents.detail.subtitle',
      sectionTitle: 'koc.incidents.detail.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/configuration/agents',
    component: AgentCatalogComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.configuration.agents.title',
      subtitle: 'koc.configuration.agents.subtitle',
      sectionTitle: 'koc.configuration.agents.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/configuration/workflow-templates',
    component: WorkflowTemplateListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.configuration.workflowTemplates.title',
      subtitle: 'koc.configuration.workflowTemplates.subtitle',
      sectionTitle: 'koc.configuration.workflowTemplates.sectionTitle',
    },
  },
  {
    path: 'ai-agent-mcrs/koc/configuration/screening-templates',
    component: ScreeningTemplateListComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_READ'],
      title: 'koc.configuration.screeningTemplates.title',
      subtitle: 'koc.configuration.screeningTemplates.subtitle',
      sectionTitle: 'koc.configuration.screeningTemplates.sectionTitle',
    },
  },
];
