import {
  workflowConditionToExpression,
  workflowGraphFromBpmnXml,
  workflowGraphToBpmnXml,
} from './workflow-bpmn-adapter';
import type { WorkflowGraph } from '../model/workflow-studio.model';

describe('workflow bpmn adapter', () => {
  it('maps Flowable workflow graphs to BPMN XML without losing node and edge identity', () => {
    const xml = workflowGraphToBpmnXml(sampleGraph(), {
      processId: 'wf-1_v1',
      processName: 'KOC evaluation',
    });

    expect(xml).toContain('<process id="wf_1_v1" name="KOC evaluation" isExecutable="true">');
    expect(xml).toContain('<startEvent id="start" name="Start" />');
    expect(xml).toContain('<serviceTask id="service" name="Service review" />');
    expect(xml).not.toContain('flowable:topic="ai"');
    expect(xml).not.toContain('flowable:taskConfigJson');
    expect(xml).toContain('<exclusiveGateway id="xor" name="Score branch" default="flow-default" />');
    expect(xml).toContain('id="flow-pass" sourceRef="xor" targetRef="service"');
    expect(xml).toContain('devtool:conditionJson="{&quot;type&quot;:&quot;COMPARE&quot;');
    expect(xml).toContain('<conditionExpression xsi:type="tFormalExpression">${input.candidate.followers &gt;= 1000}</conditionExpression>');
  });

  it('prefixes persisted numeric workflow ids so bpmn-js can display the diagram', () => {
    const xml = workflowGraphToBpmnXml(sampleGraph(), {
      processId: '68af7e4f8c8b6d1c2a5e9f01',
    });

    expect(xml).toContain('<process id="wf_68af7e4f8c8b6d1c2a5e9f01"');
    expect(xml).toContain('id="wf_68af7e4f8c8b6d1c2a5e9f01_diagram"');
    expect(xml).toContain('bpmnElement="wf_68af7e4f8c8b6d1c2a5e9f01"');
  });

  it('maps BPMN XML back to backend DTO graph and preserves structured condition metadata', () => {
    const result = workflowGraphFromBpmnXml(workflowGraphToBpmnXml(sampleGraph(), {
      processId: 'wf-1_v1',
    }));

    expect(result.issues).toEqual([]);
    expect(result.processId).toBe('wf_1_v1');
    expect(result.graph.nodes).toEqual(sampleGraph().nodes);
    expect(result.graph.edges).toEqual(sampleGraph().edges);
  });

  it('reports unsupported BPMN elements with element-specific issues', () => {
    const result = workflowGraphFromBpmnXml(`
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
        <process id="wf" isExecutable="true">
          <userTask id="manual-review" />
          <serviceTask id="generic-service" />
        </process>
      </definitions>
    `);

    expect(result.graph.nodes).toEqual([
      { id: 'generic-service', type: 'SERVICE_TASK', name: null, config: {}, inputMapping: {}, outputMapping: {}, retryPolicy: {}, timeoutPolicy: {} },
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'BPMN_ELEMENT_UNSUPPORTED', nodeId: 'manual-review' }),
    ]);
  });

  it('compiles structured conditions for display while keeping editor source structured', () => {
    expect(workflowConditionToExpression({
      type: 'COMPOSITE',
      operator: 'OR',
      conditions: [
        {
          type: 'COMPARE',
          left: { path: 'input.score' },
          operator: 'GTE',
          right: { literal: 80 },
        },
        {
          type: 'COMPARE',
          left: { path: 'input.approved' },
          operator: 'EQ',
          right: { literal: true },
        },
      ],
    })).toBe('${(input.score >= 80 || input.approved == true)}');
  });
});

function sampleGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: 'start', type: 'START_EVENT', name: 'Start' },
      { id: 'xor', type: 'EXCLUSIVE_GATEWAY', name: 'Score branch' },
      {
        id: 'service',
        type: 'SERVICE_TASK',
        name: 'Service review',
        config: {},
        inputMapping: {},
        outputMapping: {},
        retryPolicy: {},
        timeoutPolicy: {},
      },
      { id: 'end', type: 'END_EVENT', name: 'End' },
    ],
    edges: [
      { id: 'start-to-xor', source: 'start', target: 'xor', defaultFlow: false },
      {
        id: 'flow-pass',
        source: 'xor',
        target: 'service',
        name: 'Pass',
        condition: {
          type: 'COMPARE',
          left: { path: 'input.candidate.followers' },
          operator: 'GTE',
          right: { literal: 1000 },
        },
        defaultFlow: false,
      },
      { id: 'flow-default', source: 'xor', target: 'end', defaultFlow: true },
    ],
  };
}
