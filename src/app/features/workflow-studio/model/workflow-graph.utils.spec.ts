import { computeWorkflowRuntimeVisualState, workflowEdgeId } from './workflow-graph.utils';
import { WorkflowEdge, WorkflowNodeExecution } from './workflow-studio.model';

describe('WorkflowGraphUtils', () => {
  it('computes edge id with fallback', () => {
    expect(workflowEdgeId({ id: 'flow-1', source: 'a', target: 'b' })).toBe('flow-1');
    expect(workflowEdgeId({ source: 'a', target: 'b' })).toBe('a__b');
  });

  it('computes traversed sequence flow edge visual state in runtime mode', () => {
    const executions: WorkflowNodeExecution[] = [
      {
        nodeId: 'start',
        nodeType: 'START',
        executionStatus: 'COMPLETED',
        outcome: 'PASS',
        attempt: 1,
        inputSnapshot: null,
        output: null,
        evidence: null,
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
      {
        nodeId: 'task-1',
        nodeType: 'SERVICE_TASK',
        executionStatus: 'COMPLETED',
        outcome: 'PASS',
        attempt: 1,
        inputSnapshot: null,
        output: null,
        evidence: null,
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
      {
        nodeId: 'task-2',
        nodeType: 'SERVICE_TASK',
        executionStatus: 'RUNNING',
        outcome: null,
        attempt: 1,
        inputSnapshot: null,
        output: null,
        evidence: null,
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
    ];

    const edges: WorkflowEdge[] = [
      { id: 'flow-start-task1', source: 'start', target: 'task-1' },
      { id: 'flow-task1-task2', source: 'task-1', target: 'task-2' },
      { id: 'flow-task2-end', source: 'task-2', target: 'end' },
    ];

    const visualState = computeWorkflowRuntimeVisualState(executions, edges);

    expect(visualState.nodes).toEqual({
      start: 'COMPLETED',
      'task-1': 'COMPLETED',
      'task-2': 'RUNNING',
    });

    expect(visualState.edges).toEqual({
      'flow-start-task1': 'COMPLETED',
      'flow-task1-task2': 'RUNNING',
    });
  });
});
