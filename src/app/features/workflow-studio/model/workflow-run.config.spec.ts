import { describe, expect, it } from 'vitest';
import { buildWorkflowRunTableConfig } from './workflow-run.config';
import { WorkflowDefinition, WorkflowRun } from './workflow-studio.model';

describe('buildWorkflowRunTableConfig', () => {
  it('formats workflowDefinitionId into readable name when found in workflow map', () => {
    const workflows: WorkflowDefinition[] = [
      { id: 'wf-123', name: 'Facebook Login Flow' } as any,
    ];
    const config = buildWorkflowRunTableConfig(workflows);
    const col = config.columns.find((c) => c.field === 'workflowDefinitionId');
    expect(col).toBeDefined();
    expect(col?.formatter).toBeDefined();

    const rowWithMatchedWf: WorkflowRun = {
      id: 'run-1',
      workflowDefinitionId: 'wf-123',
    } as any;
    expect(col?.formatter?.(rowWithMatchedWf, 'wf-123')).toBe('Facebook Login Flow');

    const rowWithUnmatchedWf: WorkflowRun = {
      id: 'run-2',
      workflowDefinitionId: 'wf-456',
    } as any;
    expect(col?.formatter?.(rowWithUnmatchedWf, 'wf-456')).toBe('wf-456');

    const rowWithEmptyWf: WorkflowRun = {
      id: 'run-3',
      workflowDefinitionId: '',
    } as any;
    expect(col?.formatter?.(rowWithEmptyWf, '')).toBe('—');
  });

  it('configures startedAt and completedAt as datetime with sortable enabled', () => {
    const config = buildWorkflowRunTableConfig([]);
    const startedAtCol = config.columns.find((c) => c.field === 'startedAt');
    expect(startedAtCol).toBeDefined();
    expect(startedAtCol?.type).toBe('datetime');
    expect(startedAtCol?.sortable).toBe(true);
    expect(startedAtCol?.width).toBe('14rem');

    const completedAtCol = config.columns.find((c) => c.field === 'completedAt');
    expect(completedAtCol).toBeDefined();
    expect(completedAtCol?.type).toBe('datetime');
    expect(completedAtCol?.sortable).toBe(true);
  });
});
