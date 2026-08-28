import {
  createWorkflowNode,
  createWorkflowNodeId,
  workflowNodeCatalogItems,
  workflowNodePorts,
  workflowNodeView,
} from './workflow-node-catalog';
import { WorkflowNodeType } from './workflow-studio.model';

describe('workflow node catalog', () => {
  it('creates strongly typed defaults for every backend workflow node type', () => {
    const types: WorkflowNodeType[] = [
      'START',
      'CODE_GATE',
      'AI_GATE',
      'LOGIC',
      'END',
      'START_EVENT',
      'END_EVENT',
      'SERVICE_TASK',
      'CALL_ACTIVITY',
      'USER_TASK',
      'EXCLUSIVE_GATEWAY',
      'INCLUSIVE_GATEWAY',
      'PARALLEL_GATEWAY',
      'EVENT_BASED_GATEWAY',
      'INTERMEDIATE_CATCH_EVENT',
    ];

    expect(types.map((type) => createWorkflowNode(type, `${type}-1`).type)).toEqual(types);
    expect(createWorkflowNode('AI_GATE', 'ai-1')).toMatchObject({
      id: 'ai-1',
      type: 'AI_GATE',
      instruction: '',
      criteria: {},
      inputMapping: { mapping: {} },
      provider: '',
      agentCode: '',
      workingDirectory: '',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 1 },
      timeoutPolicy: { timeoutSeconds: 30 },
    });
    expect(createWorkflowNode('LOGIC', 'logic-1')).toMatchObject({
      id: 'logic-1',
      type: 'LOGIC',
      operator: 'AND',
      config: {},
    });
    expect(createWorkflowNode('CALL_ACTIVITY', 'call-1')).toMatchObject({
      id: 'call-1',
      type: 'CALL_ACTIVITY',
      name: 'Call Activity',
    });
    expect(createWorkflowNode('INCLUSIVE_GATEWAY', 'inc-1')).toMatchObject({
      id: 'inc-1',
      type: 'INCLUSIVE_GATEWAY',
      name: 'Inclusive Gateway',
    });
    expect(createWorkflowNode('INTERMEDIATE_CATCH_EVENT', 'catch-1')).toMatchObject({
      id: 'catch-1',
      type: 'INTERMEDIATE_CATCH_EVENT',
      name: 'Catch Event',
    });
  });

  it('describes supported palette items and connector contracts', () => {
    expect(workflowNodeCatalogItems().map((item) => item.type)).toEqual([
      'START',
      'CODE_GATE',
      'AI_GATE',
      'LOGIC',
      'END',
    ]);
    expect(workflowNodePorts('START')).toEqual([{ id: 'out', direction: 'out', label: 'Out' }]);
    expect(workflowNodePorts('END')).toEqual([{ id: 'in', direction: 'in', label: 'In' }]);
    expect(workflowNodePorts('AI_GATE')).toEqual([
      { id: 'in', direction: 'in', label: 'In' },
      { id: 'out', direction: 'out', label: 'Out' },
    ]);
  });

  it('builds runtime-ready node view models without mutating workflow nodes', () => {
    const aiGate = createWorkflowNode('AI_GATE', 'ai-1');
    const original = structuredClone(aiGate);

    const view = workflowNodeView({
      ...aiGate,
      instruction: 'Review profile',
      provider: 'codex',
      agentCode: 'koc-rule-evaluator',
    }, {
      selected: true,
      runtimeStatus: 'RUNNING',
      validationSeverity: 'error',
    });

    expect(view).toMatchObject({
      id: 'ai-1',
      type: 'AI_GATE',
      title: 'AI Gate',
      subtitle: 'Review profile',
      selected: true,
      runtimeStatus: 'RUNNING',
      validationSeverity: 'error',
      iconLabel: 'AI',
    });
    expect(aiGate).toEqual(original);
  });

  it('creates stable new IDs without colliding with existing graph nodes', () => {
    expect(createWorkflowNodeId('AI_GATE', ['ai-gate-1', 'ai-gate-2'])).toBe('ai-gate-3');
    expect(createWorkflowNodeId('START', [])).toBe('start-1');
  });
});
