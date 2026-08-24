import {
  WORKFLOW_FLOW_NODE_TYPES,
  workflowCanvasModeToFlowMode,
  workflowCanvasReadonly,
  workflowGraphFromFlowDefinition,
  workflowGraphToFlowDefinition,
  workflowNodeExecutionStatusToFlowStatus,
  workflowPositionsFromFlowDefinition,
  workflowViewportFromFlowDefinition,
} from './workflow-flow-adapter';
import { WorkflowGraph } from '../model/workflow-studio.model';

describe('workflow flow adapter', () => {
  it('maps workflow domain graph to flow definition without losing node contracts', () => {
    const graph = sampleGraph();

    const flow = workflowGraphToFlowDefinition(graph, {
      workflowId: 'wf-1',
      workflowName: 'KOC screening',
      positions: {
        start: { x: 10, y: 20 },
        'ai-gate': { x: 260, y: 20 },
      },
      viewport: { x: 12, y: 24, zoom: 0.85 },
      mode: 'readonly',
    });

    expect(flow).toMatchObject({
      id: 'wf-1',
      version: 1,
      name: 'KOC screening',
      readonly: true,
      viewport: { x: 12, y: 24, zoom: 0.85 },
    });
    expect(flow.nodes).toHaveLength(3);
    expect(flow.nodes[0]).toMatchObject({
      id: 'start',
      type: 'START',
      label: 'Start',
      position: { x: 10, y: 20 },
      data: { workflowNode: { id: 'start', type: 'START' } },
    });
    expect(flow.nodes[1].data?.['workflowNode']).toEqual(graph.nodes[1]);
    expect(flow.edges).toEqual([
      {
        id: 'start__ai-gate',
        source: { nodeId: 'start', portId: 'out' },
        target: { nodeId: 'ai-gate', portId: 'in' },
      },
      {
        id: 'ai-gate__end',
        source: { nodeId: 'ai-gate', portId: 'out' },
        target: { nodeId: 'end', portId: 'in' },
      },
    ]);
  });

  it('maps flow definition changes back to workflow domain graph and editor metadata', () => {
    const flow = workflowGraphToFlowDefinition(sampleGraph(), {
      positions: {
        start: { x: 10, y: 20 },
        'ai-gate': { x: 260, y: 20 },
        end: { x: 510, y: 20 },
      },
      viewport: { x: 1, y: 2, zoom: 0.9 },
    });

    const graph = workflowGraphFromFlowDefinition({
      ...flow,
      edges: [
        {
          id: 'start__end',
          source: { nodeId: 'start', portId: 'out' },
          target: { nodeId: 'end', portId: 'in' },
        },
      ],
    });

    expect(graph.nodes[1]).toEqual(sampleGraph().nodes[1]);
    expect(graph.edges).toEqual([{ source: 'start', target: 'end' }]);
    expect(workflowPositionsFromFlowDefinition(flow)).toEqual({
      start: { x: 10, y: 20 },
      'ai-gate': { x: 260, y: 20 },
      end: { x: 510, y: 20 },
    });
    expect(workflowViewportFromFlowDefinition(flow)).toEqual({ x: 1, y: 2, zoom: 0.9 });
  });

  it('exposes node type metadata and maps workflow modes to flow-builder modes', () => {
    expect(WORKFLOW_FLOW_NODE_TYPES.map((type) => type.type)).toEqual([
      'START',
      'CODE_GATE',
      'AI_GATE',
      'LOGIC',
      'END',
    ]);
    expect(workflowCanvasModeToFlowMode('design')).toBe('edit');
    expect(workflowCanvasModeToFlowMode('runtime')).toBe('trace');
    expect(workflowCanvasModeToFlowMode('readonly')).toBe('readonly');
    expect(workflowCanvasReadonly('design')).toBe(false);
    expect(workflowCanvasReadonly('runtime')).toBe(true);
    expect(workflowCanvasReadonly('readonly')).toBe(true);
  });

  it('applies runtime visual states without mutating workflow definitions', () => {
    const graph = sampleGraph();
    const original = structuredClone(graph);

    const flow = workflowGraphToFlowDefinition(graph, {
      runtimeStatus: {
        nodes: {
          'ai-gate': 'RUNNING',
          end: 'ERROR',
        },
        edges: {
          'start__ai-gate': 'COMPLETED',
        },
      },
    });

    expect(flow.nodes.find((node) => node.id === 'ai-gate')?.status).toBe('warning');
    expect(flow.nodes.find((node) => node.id === 'end')?.status).toBe('danger');
    expect(flow.edges.find((edge) => edge.id === 'start__ai-gate')?.status).toBe('success');
    expect(graph).toEqual(original);
  });

  it('maps every workflow node execution status to a flow visual status', () => {
    expect(workflowNodeExecutionStatusToFlowStatus('PENDING')).toBe('default');
    expect(workflowNodeExecutionStatusToFlowStatus('READY')).toBe('default');
    expect(workflowNodeExecutionStatusToFlowStatus('RUNNING')).toBe('warning');
    expect(workflowNodeExecutionStatusToFlowStatus('WAITING_EXTERNAL')).toBe('warning');
    expect(workflowNodeExecutionStatusToFlowStatus('COMPLETED')).toBe('success');
    expect(workflowNodeExecutionStatusToFlowStatus('ERROR')).toBe('danger');
    expect(workflowNodeExecutionStatusToFlowStatus('TIMED_OUT')).toBe('danger');
    expect(workflowNodeExecutionStatusToFlowStatus('CANCELLED')).toBe('danger');
    expect(workflowNodeExecutionStatusToFlowStatus('SKIPPED')).toBe('muted');
  });
});

function sampleGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: 'start', type: 'START' },
      {
        id: 'ai-gate',
        type: 'AI_GATE',
        instruction: 'Check profile safety',
        criteria: { minFollowers: 1000 },
        inputMapping: { mapping: { profile: '${input.profile}' } },
        provider: 'codex',
        agentCode: 'koc-rule-evaluator',
        workingDirectory: 'D:\\Code\\ai-agent-mcrs',
        outputSchema: 'gate-result-v1',
        retryPolicy: { maxAttempts: 2 },
        timeoutPolicy: { timeoutSeconds: 3600 },
      },
      { id: 'end', type: 'END' },
    ],
    edges: [
      { source: 'start', target: 'ai-gate' },
      { source: 'ai-gate', target: 'end' },
    ],
  };
}
