import type { FlowDefinition } from '../../../../../shared/ui/flow-builder/models';
import type { WorkflowEdge, WorkflowNode } from '../../../../../core/models/ai-agent/ai-agent-workflow.model';
import {
  createAiAgentWorkflowNodeTypes,
  flowDefinitionToWorkflowGraph,
  normalizeWorkflowEdges,
  normalizeWorkflowFlowDefinition,
  workflowGraphToFlowDefinition,
} from './ai-agent-workflow-flow-adapter';

describe('ai agent workflow flow adapter', () => {
  const nodes: WorkflowNode[] = [
    {
      id: 'agent',
      type: 'AI_AGENT_STEP',
      name: 'Classify',
      config: JSON.stringify({ agentConfigId: 'agent-1', timeoutMs: 45000 }),
      position: { x: 100, y: 120 },
    },
    {
      id: 'logic',
      type: 'LOGIC_STEP',
      name: 'Map output',
      config: JSON.stringify({ logicCode: 'MAP_OUTPUT', params: { field: 'value' } }),
      position: { x: 100, y: 260 },
    },
    {
      id: 'end',
      type: 'END_NODE',
      name: 'Done',
      position: { x: 100, y: 420 },
    },
  ];

  it('maps persisted workflow graph to flow definition for JointJS canvas', () => {
    const flow = workflowGraphToFlowDefinition({
      id: 'wf-1',
      name: 'Support agent',
      nodes,
      edges: [{ id: 'edge-1', source: 'agent', target: 'logic', condition: '#ok', label: 'ok' }],
    });

    expect(flow.id).toBe('wf-1');
    expect(flow.nodes.length).toBe(3);
    expect(flow.nodes[0]).toEqual(expect.objectContaining({
      id: 'agent',
      type: 'AI_AGENT_STEP',
      label: 'Classify',
      position: { x: 100, y: 120 },
    }));
    expect(flow.nodes[0].data).toEqual(expect.objectContaining({
      agentConfigId: 'agent-1',
      timeoutMs: 45000,
      workflowType: 'AI_AGENT_STEP',
    }));
    expect(flow.edges[0]).toEqual(expect.objectContaining({
      id: 'edge-1',
      source: { nodeId: 'agent', portId: 'out' },
      target: { nodeId: 'logic', portId: 'in' },
      label: 'ok',
      data: { condition: '#ok' },
    }));
  });

  it('maps edited flow definition back to backend draft graph without losing config and positions', () => {
    const flow = workflowGraphToFlowDefinition({
      id: 'wf-1',
      nodes,
      edges: [{ id: 'edge-1', source: 'agent', target: 'logic', condition: '#ok' }],
    });
    const edited: FlowDefinition = {
      ...flow,
      nodes: flow.nodes.map(node => node.id === 'logic'
        ? {
            ...node,
            label: 'Normalize payload',
            position: { x: 240, y: 360 },
            data: {
              ...(node.data ?? {}),
              logicCode: 'VALIDATE_SCHEMA',
              params: '{"schema":"ticket"}',
            },
          }
        : node),
      edges: flow.edges.map(edge => ({
        ...edge,
        label: 'valid',
        data: { condition: '#result.valid == true' },
      })),
    };

    const graph = flowDefinitionToWorkflowGraph(edited);

    const logic = graph.nodes.find(node => node.id === 'logic');
    expect(logic?.name).toBe('Normalize payload');
    expect(logic?.position).toEqual({ x: 240, y: 360 });
    expect(JSON.parse(logic?.config ?? '{}')).toEqual(expect.objectContaining({
      logicCode: 'VALIDATE_SCHEMA',
      params: { schema: 'ticket' },
    }));
    expect(graph.edges).toEqual([{
      id: 'edge-1',
      source: 'agent',
      target: 'logic',
      condition: '#result.valid == true',
      label: 'valid',
    }]);
  });

  it('drops duplicate, self, missing-node, and END_NODE outgoing edges before saving', () => {
    const edges: WorkflowEdge[] = [
      { id: 'ok', source: 'agent', target: 'logic' },
      { id: 'duplicate', source: 'agent', target: 'logic' },
      { id: 'self', source: 'logic', target: 'logic' },
      { id: 'missing-source', source: 'missing', target: 'logic' },
      { id: 'missing-target', source: 'agent', target: 'missing' },
      { id: 'end-out', source: 'end', target: 'agent' },
    ];

    expect(normalizeWorkflowEdges(nodes, edges)).toEqual([
      { id: 'ok', source: 'agent', target: 'logic' },
    ]);
  });

  it('normalizes invalid flow edges created by the canvas before autosave', () => {
    const flow = workflowGraphToFlowDefinition({
      id: 'wf-1',
      nodes,
      edges: [],
    });
    const dirty: FlowDefinition = {
      ...flow,
      edges: [
        {
          id: 'valid',
          source: { nodeId: 'agent', portId: 'out' },
          target: { nodeId: 'logic', portId: 'in' },
        },
        {
          id: 'duplicate',
          source: { nodeId: 'agent', portId: 'out' },
          target: { nodeId: 'logic', portId: 'in' },
        },
        {
          id: 'end-out',
          source: { nodeId: 'end', portId: 'out' },
          target: { nodeId: 'agent', portId: 'in' },
        },
      ],
    };

    expect(normalizeWorkflowFlowDefinition(dirty).edges.map(edge => edge.id)).toEqual(['valid']);
  });

  it('exposes core-only SVG shapes, ports, and form schemas needed by the shared flow builder', () => {
    const nodeTypes = createAiAgentWorkflowNodeTypes();
    const end = nodeTypes.find(type => type.type === 'END_NODE');
    const logic = nodeTypes.find(type => type.type === 'LOGIC_STEP');
    const branch = nodeTypes.find(type => type.type === 'BRANCH_NODE');

    expect(nodeTypes.length).toBe(5);
    expect(nodeTypes.every(type => type.shape !== 'custom')).toBeTruthy();
    expect(logic?.shape).toBe('rectangle');
    expect(branch?.shape).toBe('diamond');
    expect(end?.allowConnectFrom).toBeFalsy();
    expect(end?.ports).toEqual([{ id: 'in', group: 'in', position: 'top' }]);
    expect(logic?.ports.some(port => port.group === 'out')).toBeTruthy();
    expect(logic?.inspectorForm?.fields.length).toBeGreaterThan(1);
  });
});
