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
    expect(xml).toContain('flowable:topic="ai"');
    expect(xml).toContain('flowable:taskConfigJson="{&quot;agentCode&quot;:&quot;koc-rule-evaluator&quot;');
    expect(xml).toContain('<exclusiveGateway id="xor" name="Score branch" default="flow-default" />');
    expect(xml).toContain('id="flow-pass" sourceRef="xor" targetRef="ai"');
    expect(xml).toContain('devtool:conditionJson="{&quot;type&quot;:&quot;COMPARE&quot;');
    expect(xml).toContain('<conditionExpression xsi:type="tFormalExpression">${input.candidate.followers &gt;= 1000}</conditionExpression>');
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
          <serviceTask id="missing-topic" />
        </process>
      </definitions>
    `);

    expect(result.graph.nodes).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'BPMN_ELEMENT_UNSUPPORTED', nodeId: 'manual-review' }),
      expect.objectContaining({ code: 'BPMN_SERVICE_TASK_TOPIC_UNSUPPORTED', nodeId: 'missing-topic' }),
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
        id: 'ai',
        type: 'AI_TASK',
        name: 'AI review',
        config: { agentCode: 'koc-rule-evaluator' },
        inputMapping: { candidate: '${input.candidate}' },
        outputMapping: { decision: '${output.accepted}' },
        retryPolicy: { maxAttempts: 2 },
        timeoutPolicy: { timeoutSeconds: 300 },
      },
      { id: 'end', type: 'END_EVENT', name: 'End' },
    ],
    edges: [
      { id: 'start-to-xor', source: 'start', target: 'xor', defaultFlow: false },
      {
        id: 'flow-pass',
        source: 'xor',
        target: 'ai',
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
