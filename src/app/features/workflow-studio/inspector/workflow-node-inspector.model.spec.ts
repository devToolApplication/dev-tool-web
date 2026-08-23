import { createWorkflowNode } from '../model/workflow-node-catalog';
import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  LogicWorkflowNode,
} from '../model/workflow-studio.model';
import {
  workflowNodeInspectorConfig,
  workflowNodePatchFromInspectorValue,
  workflowNodeToInspectorValue,
} from './workflow-node-inspector.model';

describe('workflow node inspector model', () => {
  it('builds typed AI gate fields with JSON fields in advanced sections', () => {
    const config = workflowNodeInspectorConfig('AI_GATE');
    const fieldNames = config.fields.map((field) => field.name);
    const criteriaField = config.fields.find((field) => field.name === 'criteria');

    expect(config.sections?.map((section) => section.id)).toEqual([
      'general',
      'agent',
      'prompt',
      'decision',
      'input',
      'output',
      'execution',
    ]);
    expect(fieldNames).toEqual([
      'id',
      'provider',
      'modelProfile',
      'toolProfile',
      'instruction',
      'criteria',
      'inputMapping',
      'outputSchema',
      'maxAttempts',
      'timeoutSeconds',
    ]);
    expect(config.fields.find((field) => field.name === 'id')).toMatchObject({
      type: 'text',
      disabledWhen: 'true',
    });
    expect(criteriaField).toMatchObject({
      type: 'json',
      showZoomButton: true,
    });
  });

  it('maps AI gate form values into contract fields and rejects invalid advanced JSON', () => {
    const node: AiGateWorkflowNode = {
      ...createWorkflowNode('AI_GATE', 'ai-1'),
      instruction: 'Review profile',
      criteria: { minScore: 80 },
      inputMapping: { mapping: { candidate: '${input.candidate}' } },
      provider: 'claude',
      modelProfile: 'gpt-5.2',
      toolProfile: 'facebook-readonly',
      outputSchema: 'koc-review-v1',
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 3600 },
    };

    const value = workflowNodeToInspectorValue(node);
    const patch = workflowNodePatchFromInspectorValue(node, {
      ...value,
      instruction: 'Updated review',
      criteria: '{"minScore":90}',
      inputMapping: '{"mapping":{"candidate":"${input.profile}"}}',
      maxAttempts: 3,
      timeoutSeconds: 1800,
    });

    expect(value).toMatchObject({
      id: 'ai-1',
      provider: 'claude',
      criteria: JSON.stringify({ minScore: 80 }, null, 2),
      inputMapping: JSON.stringify({ mapping: { candidate: '${input.candidate}' } }, null, 2),
    });
    expect(patch).toEqual({
      instruction: 'Updated review',
      criteria: { minScore: 90 },
      inputMapping: { mapping: { candidate: '${input.profile}' } },
      provider: 'claude',
      modelProfile: 'gpt-5.2',
      toolProfile: 'facebook-readonly',
      outputSchema: 'koc-review-v1',
      retryPolicy: { maxAttempts: 3 },
      timeoutPolicy: { timeoutSeconds: 1800 },
    });
    expect(workflowNodePatchFromInspectorValue(node, {
      ...value,
      criteria: '{bad json',
    })).toBeNull();
  });

  it('maps code gate handler, config, input mapping and execution policies', () => {
    const node: CodeGateWorkflowNode = {
      ...createWorkflowNode('CODE_GATE', 'code-1'),
      handler: 'NUMBER_COMPARE',
      config: { operator: 'LT' },
      inputMapping: { mapping: { left: '${input.followers}', right: 50000 } },
    };

    const patch = workflowNodePatchFromInspectorValue(node, {
      ...workflowNodeToInspectorValue(node),
      handler: 'STRING_COMPARE',
      config: '{"operator":"CONTAINS","right":"parent"}',
      inputMapping: '{"mapping":{"left":"${input.bio}"}}',
      maxAttempts: 2,
      timeoutSeconds: 5,
    });

    expect(patch).toEqual({
      handler: 'STRING_COMPARE',
      config: { operator: 'CONTAINS', right: 'parent' },
      inputMapping: { mapping: { left: '${input.bio}' } },
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 5 },
    });
  });

  it('maps logic operator-specific fields to the backend config contract', () => {
    const node: LogicWorkflowNode = createWorkflowNode('LOGIC', 'logic-1');

    expect(workflowNodePatchFromInspectorValue(node, {
      id: 'logic-1',
      operator: 'N_OF_M',
      required: 2,
      config: '{}',
    })).toEqual({
      operator: 'N_OF_M',
      config: { required: 2 },
    });

    expect(workflowNodePatchFromInspectorValue(node, {
      id: 'logic-1',
      operator: 'SWITCH',
      casePassTarget: 'approved',
      caseFailTarget: 'rejected',
      caseBlockedTarget: 'manual',
      defaultTarget: 'manual',
      config: '{}',
    })).toEqual({
      operator: 'SWITCH',
      config: {
        cases: {
          PASS: 'approved',
          FAIL: 'rejected',
          BLOCKED: 'manual',
        },
        default: 'manual',
      },
    });

    expect(workflowNodePatchFromInspectorValue({
      ...node,
      operator: 'SWITCH',
      config: { cases: { PASS: 'approved' } },
    }, {
      id: 'logic-1',
      operator: 'AND',
      config: '{"cases":{"PASS":"stale"}}',
    })).toEqual({
      operator: 'AND',
      config: {},
    });
  });
});
