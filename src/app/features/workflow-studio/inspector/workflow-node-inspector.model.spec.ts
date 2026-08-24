import { createWorkflowNode } from '../model/workflow-node-catalog';
import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  LogicWorkflowNode,
} from '../model/workflow-studio.model';
import {
  workflowFieldToSectionId,
  workflowNodeInspectorConfig,
  workflowNodePatchFromInspectorValue,
  workflowNodeToInspectorValue,
} from './workflow-node-inspector.model';

describe('workflow node inspector model', () => {
  it('builds typed AI gate fields without raw criteria in form-input config and maps field to section', () => {
    const config = workflowNodeInspectorConfig('AI_GATE');
    const fieldNames = config.fields.map((field) => field.name);

    expect(config.sections?.map((section) => section.id)).toEqual([
      'general',
      'agent',
      'prompt',
      'output',
      'execution',
    ]);
    expect(fieldNames).toEqual([
      'id',
      'agentCode',
      'provider',
      'workingDirectory',
      'instruction',
      'outputSchema',
      'maxAttempts',
      'timeoutSeconds',
    ]);
    expect(config.fields.find((field) => field.name === 'id')).toMatchObject({
      type: 'text',
      disabledWhen: 'true',
    });
    expect(config.fields.find((field) => field.name === 'agentCode')).toMatchObject({
      type: 'select',
      optionsExpression: 'context.extra.agentOptions',
      required: true,
    });
    expect(config.fields.find((field) => field.name === 'outputSchema')).toMatchObject({
      type: 'auto-complete',
      optionsExpression: 'context.extra.outputSchemaOptions',
      required: true,
    });

    expect(workflowFieldToSectionId('AI_GATE', 'criteria')).toBe('decision');
    expect(workflowFieldToSectionId('AI_GATE', 'inputMapping')).toBe('input');
    expect(workflowFieldToSectionId('AI_GATE', 'instruction')).toBe('prompt');
  });

  it('maps AI gate form values into contract fields and rejects invalid advanced JSON', () => {
    const node: AiGateWorkflowNode = {
      ...createWorkflowNode('AI_GATE', 'ai-1'),
      instruction: 'Review profile',
      criteria: { minScore: 80 },
      inputMapping: { mapping: { candidate: '${input.candidate}' } },
      provider: 'claude',
      agentCode: 'koc-rule-evaluator',
      workingDirectory: 'D:\\Code\\ai-agent-mcrs',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 3600 },
    };

    const value = workflowNodeToInspectorValue(node);
    const patch = workflowNodePatchFromInspectorValue(node, {
      ...value,
      instruction: 'Updated review',
      criteria: '{"minScore":90}',
      maxAttempts: 3,
      timeoutSeconds: 1800,
    });

    expect(value).toMatchObject({
      id: 'ai-1',
      agentCode: 'koc-rule-evaluator',
      provider: 'claude',
      workingDirectory: 'D:\\Code\\ai-agent-mcrs',
      criteria: JSON.stringify({ minScore: 80 }, null, 2),
    });
    expect(patch).toEqual({
      instruction: 'Updated review',
      criteria: { minScore: 90 },
      provider: 'claude',
      agentCode: 'koc-rule-evaluator',
      workingDirectory: 'D:\\Code\\ai-agent-mcrs',
      outputSchema: 'gate-result-v1',
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

  it('configures vertical layout with compact density, sectionNavigation none, and expected section collapsed states', () => {
    const aiConfig = workflowNodeInspectorConfig('AI_GATE');
    expect(aiConfig.layout).toMatchObject({
      mode: 'sectioned',
      density: 'compact',
      labelPlacement: 'top',
      sectionNavigation: 'none',
      showValidationSummary: true,
      stickyFooter: false,
      autoScrollToError: false,
    });
    expect(aiConfig.sections).toEqual([
      { id: 'general', title: 'workflowStudio.inspector.section.general', collapsible: false, collapsed: false },
      { id: 'agent', title: 'workflowStudio.inspector.section.agent', collapsible: false, collapsed: false },
      { id: 'prompt', title: 'workflowStudio.inspector.section.prompt', collapsible: false, collapsed: false },
      { id: 'output', title: 'workflowStudio.inspector.section.output', collapsible: true, collapsed: true },
      { id: 'execution', title: 'workflowStudio.inspector.section.execution', collapsible: true, collapsed: true },
    ]);

    const codeConfig = workflowNodeInspectorConfig('CODE_GATE');
    expect(codeConfig.layout?.sectionNavigation).toBe('none');
    expect(codeConfig.sections).toEqual([
      { id: 'general', title: 'workflowStudio.inspector.section.general', collapsible: false, collapsed: false },
      { id: 'configuration', title: 'workflowStudio.inspector.section.configuration', collapsible: true, collapsed: true },
      { id: 'input', title: 'workflowStudio.inspector.section.input', collapsible: true, collapsed: true },
      { id: 'execution', title: 'workflowStudio.inspector.section.execution', collapsible: true, collapsed: true },
    ]);

    const logicConfig = workflowNodeInspectorConfig('LOGIC');
    expect(logicConfig.layout?.sectionNavigation).toBe('none');
    expect(logicConfig.sections).toEqual([
      { id: 'general', title: 'workflowStudio.inspector.section.general', collapsible: false, collapsed: false },
      { id: 'logic', title: 'workflowStudio.inspector.section.logic', collapsible: false, collapsed: false },
      { id: 'routing', title: 'workflowStudio.inspector.section.routing', collapsible: true, collapsed: true },
      { id: 'advanced', title: 'workflowStudio.inspector.section.advanced', collapsible: true, collapsed: true },
    ]);
  });
});
