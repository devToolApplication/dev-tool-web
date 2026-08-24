import {
  validateWorkflowConnection,
  workflowConnectionFromEdge,
} from './workflow-connection.rules';
import { WorkflowGraph } from './workflow-studio.model';

describe('workflow connection rules', () => {
  it('allows backend-compatible source/target connections', () => {
    expect(validateWorkflowConnection(sampleGraph(), { source: 'ai', target: 'end' })).toEqual([]);
    expect(workflowConnectionFromEdge({ source: 'ai', target: 'end' })).toEqual({
      id: 'ai__end',
      source: 'ai',
      target: 'end',
    });
  });

  it('rejects invalid start incoming and end outgoing connections', () => {
    expect(validateWorkflowConnection(sampleGraph(), { source: 'ai', target: 'start' })).toEqual([
      {
        code: 'START_INCOMING_NOT_ALLOWED',
        message: 'START nodes cannot have incoming connections',
        severity: 'error',
        nodeId: 'start',
      },
    ]);
    expect(validateWorkflowConnection(sampleGraph(), { source: 'end', target: 'ai' })).toEqual([
      {
        code: 'END_OUTGOING_NOT_ALLOWED',
        message: 'END nodes cannot have outgoing connections',
        severity: 'error',
        nodeId: 'end',
      },
    ]);
  });

  it('rejects unknown nodes, self loops and duplicate edges', () => {
    expect(validateWorkflowConnection(sampleGraph(), { source: 'missing', target: 'ai' })[0].code)
      .toBe('SOURCE_NODE_NOT_FOUND');
    expect(validateWorkflowConnection(sampleGraph(), { source: 'ai', target: 'missing' })[0].code)
      .toBe('TARGET_NODE_NOT_FOUND');
    expect(validateWorkflowConnection(sampleGraph(), { source: 'ai', target: 'ai' })[0].code)
      .toBe('SELF_CONNECTION_NOT_ALLOWED');
    expect(validateWorkflowConnection(sampleGraph(), { source: 'start', target: 'ai' })[0].code)
      .toBe('DUPLICATE_CONNECTION');
  });
});

function sampleGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: 'start', type: 'START' },
      {
        id: 'ai',
        type: 'AI_GATE',
        instruction: 'Review',
        criteria: {},
        inputMapping: { mapping: {} },
        provider: 'codex',
        agentCode: 'koc-rule-evaluator',
        workingDirectory: 'D:\\Code\\ai-agent-mcrs',
        outputSchema: 'gate-result-v1',
        retryPolicy: { maxAttempts: 1 },
        timeoutPolicy: { timeoutSeconds: 30 },
      },
      { id: 'end', type: 'END' },
    ],
    edges: [{ source: 'start', target: 'ai' }],
  };
}
