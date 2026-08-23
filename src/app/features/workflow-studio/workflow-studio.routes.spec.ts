import { unsavedChangesGuard } from '@shared/ui/patterns/form-input/unsaved-changes.guard';
import { workflowStudioRoutes } from './workflow-studio.routes';

describe('workflowStudioRoutes', () => {
  it('registers lifecycle routes and protects the dirty builder', () => {
    const routes = workflowStudioRoutes.map((route) => route.path);

    expect(routes).toEqual(expect.arrayContaining([
      'ai-agent-mcrs/workflows',
      'ai-agent-mcrs/workflows/create',
      'ai-agent-mcrs/workflows/:workflowId/edit',
      'ai-agent-mcrs/workflow-runs',
      'ai-agent-mcrs/workflow-runs/:runId',
    ]));
    expect(workflowStudioRoutes.find((route) => route.path === 'ai-agent-mcrs/workflows/create')?.canDeactivate)
      .toContain(unsavedChangesGuard);
    expect(workflowStudioRoutes.find((route) => route.path === 'ai-agent-mcrs/workflows/:workflowId/edit')?.canDeactivate)
      .toContain(unsavedChangesGuard);
  });
});
