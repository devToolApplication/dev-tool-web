import { serviceManagementUnsavedChangesGuard } from '@features/service-management/guards/service-management-unsaved-changes.guard';
import { permissionGuard } from '@core/auth/permission.guard';
import { CampaignDetailComponent } from './pages/campaign-detail/campaign-detail.component';
import { CampaignWizardComponent } from './pages/campaign-wizard/campaign-wizard.component';
import { CandidateDetailComponent } from './pages/candidate-detail/candidate-detail.component';
import { CandidateListComponent } from './pages/candidate-list/candidate-list.component';
import { ReviewDetailComponent } from './pages/review-detail/review-detail.component';
import { ReviewQueueComponent } from './pages/review-queue/review-queue.component';
import { IncidentDetailComponent } from './pages/incident-detail/incident-detail.component';
import { IncidentListComponent } from './pages/incident-list/incident-list.component';
import { AgentCatalogComponent } from './pages/agent-catalog/agent-catalog.component';
import { WorkflowTemplateListComponent } from './pages/workflow-template-list/workflow-template-list.component';
import { ScreeningTemplateListComponent } from './pages/screening-template-list/screening-template-list.component';
import { kocManagementRoutes } from './koc-management.routes';

describe('kocManagementRoutes', () => {
  it('registers the KOC feature route surface from the implementation plan', () => {
    expect(kocManagementRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'ai-agent-mcrs/koc',
        'ai-agent-mcrs/koc/dashboard',
        'ai-agent-mcrs/koc/campaigns',
        'ai-agent-mcrs/koc/campaigns/create',
        'ai-agent-mcrs/koc/campaigns/:campaignId',
        'ai-agent-mcrs/koc/campaigns/:campaignId/edit',
        'ai-agent-mcrs/koc/candidates',
        'ai-agent-mcrs/koc/candidates/:candidateId',
        'ai-agent-mcrs/koc/reviews',
        'ai-agent-mcrs/koc/reviews/:reviewId',
        'ai-agent-mcrs/koc/incidents',
        'ai-agent-mcrs/koc/incidents/:incidentId',
        'ai-agent-mcrs/koc/configuration/agents',
        'ai-agent-mcrs/koc/configuration/workflow-templates',
        'ai-agent-mcrs/koc/configuration/screening-templates',
      ]),
    );
  });

  it('redirects the KOC root to the dashboard', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc')).toEqual(
      expect.objectContaining({
        pathMatch: 'full',
        redirectTo: 'ai-agent-mcrs/koc/dashboard',
      }),
    );
  });

  it('keeps dirty campaign form protection inside KOC create and edit routes', () => {
    const guardedPaths = kocManagementRoutes
      .filter((route) => route.canDeactivate?.includes(serviceManagementUnsavedChangesGuard))
      .map((route) => route.path);

    expect(guardedPaths).toEqual(
      expect.arrayContaining([
        'ai-agent-mcrs/koc/campaigns/create',
        'ai-agent-mcrs/koc/campaigns/:campaignId/edit',
      ]),
    );
  });

  it('uses the campaign wizard for create and edit routes', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/campaigns/create')).toEqual(
      expect.objectContaining({
        component: CampaignWizardComponent,
        data: expect.objectContaining({ mode: 'create' }),
      }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/campaigns/:campaignId/edit')).toEqual(
      expect.objectContaining({
        component: CampaignWizardComponent,
        data: expect.objectContaining({ mode: 'edit' }),
      }),
    );
  });

  it('uses campaign detail for the runtime route', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/campaigns/:campaignId')).toEqual(
      expect.objectContaining({
        component: CampaignDetailComponent,
      }),
    );
  });

  it('uses candidate pages for candidate routes', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/candidates')).toEqual(
      expect.objectContaining({ component: CandidateListComponent }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/candidates/:candidateId')).toEqual(
      expect.objectContaining({ component: CandidateDetailComponent }),
    );
  });

  it('uses review pages for review routes', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/reviews')).toEqual(
      expect.objectContaining({ component: ReviewQueueComponent }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/reviews/:reviewId')).toEqual(
      expect.objectContaining({ component: ReviewDetailComponent }),
    );
  });

  it('uses incident pages for incident routes', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/incidents')).toEqual(
      expect.objectContaining({ component: IncidentListComponent }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/incidents/:incidentId')).toEqual(
      expect.objectContaining({ component: IncidentDetailComponent }),
    );
  });

  it('uses agent catalog and template list pages for configuration routes', () => {
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/configuration/agents')).toEqual(
      expect.objectContaining({ component: AgentCatalogComponent }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/configuration/workflow-templates')).toEqual(
      expect.objectContaining({ component: WorkflowTemplateListComponent }),
    );
    expect(kocManagementRoutes.find((route) => route.path === 'ai-agent-mcrs/koc/configuration/screening-templates')).toEqual(
      expect.objectContaining({ component: ScreeningTemplateListComponent }),
    );
  });

  it('protects read and mutate routes with permissionGuard and required permissions', () => {
    const dashboardRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/dashboard');
    expect(dashboardRoute?.canActivate).toContain(permissionGuard);
    expect(dashboardRoute?.data?.['permissions']).toEqual(['AI_AGENT_READ']);

    const campaignsRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/campaigns');
    expect(campaignsRoute?.canActivate).toContain(permissionGuard);
    expect(campaignsRoute?.data?.['permissions']).toEqual(['AI_AGENT_READ']);

    const createRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/campaigns/create');
    expect(createRoute?.canActivate).toContain(permissionGuard);
    expect(createRoute?.data?.['permissions']).toEqual(['AI_AGENT_WORKFLOW_WRITE']);

    const editRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/campaigns/:campaignId/edit');
    expect(editRoute?.canActivate).toContain(permissionGuard);
    expect(editRoute?.data?.['permissions']).toEqual(['AI_AGENT_WORKFLOW_WRITE']);

    const detailRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/campaigns/:campaignId');
    expect(detailRoute?.canActivate).toContain(permissionGuard);
    expect(detailRoute?.data?.['permissions']).toEqual(['AI_AGENT_READ']);

    const reviewDetailRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/reviews/:reviewId');
    expect(reviewDetailRoute?.canActivate).toContain(permissionGuard);
    expect(reviewDetailRoute?.data?.['permissions']).toEqual(['AI_AGENT_WORKFLOW_REVIEW', 'AI_AGENT_WORKFLOW_WRITE']);
    expect(reviewDetailRoute?.data?.['permissionsMode']).toBe('any');

    const incidentDetailRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/incidents/:incidentId');
    expect(incidentDetailRoute?.canActivate).toContain(permissionGuard);
    expect(incidentDetailRoute?.data?.['permissions']).toEqual(['AI_AGENT_READ']);

    const candidateListRoute = kocManagementRoutes.find((r) => r.path === 'ai-agent-mcrs/koc/candidates');
    expect(candidateListRoute?.canActivate).toContain(permissionGuard);
    expect(candidateListRoute?.data?.['permissions']).toEqual(['AI_AGENT_READ']);
  });
});