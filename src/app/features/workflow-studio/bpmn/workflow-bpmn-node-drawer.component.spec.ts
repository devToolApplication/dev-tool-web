import { SimpleChange } from '@angular/core';

import { WorkflowBpmnNodeDrawerComponent } from './workflow-bpmn-node-drawer.component';
import type { BpmnWorkflowNode } from '../model/workflow-studio.model';

describe('WorkflowBpmnNodeDrawerComponent', () => {
  it('emits task patches with mapping, config, output, retry and timeout sections', () => {
    const component = new WorkflowBpmnNodeDrawerComponent();
    const emitted: BpmnWorkflowNode[] = [];
    component.node = sampleNode();
    component.nodeChange.subscribe((node) => emitted.push(node));
    component.ngOnChanges({ node: new SimpleChange(null, component.node, true) });

    component.updateConfig('{ "agentCode": "koc-rule-evaluator" }');
    component.updateInputMapping('{ "candidate": "${input.candidate}" }');
    component.updateOutputMapping('{ "accepted": "${output.accepted}" }');
    component.updateMaxAttempts(3);
    component.updateTimeoutSeconds(120);

    expect(emitted.at(-1)).toMatchObject({
      id: 'ai',
      type: 'AI_TASK',
      config: { agentCode: 'koc-rule-evaluator' },
      inputMapping: { candidate: '${input.candidate}' },
      outputMapping: { accepted: '${output.accepted}' },
      retryPolicy: { maxAttempts: 3 },
      timeoutPolicy: { timeoutSeconds: 120 },
    });
  });

  it('does not emit invalid JSON patches', () => {
    const component = new WorkflowBpmnNodeDrawerComponent();
    const emitted: BpmnWorkflowNode[] = [];
    component.node = sampleNode();
    component.nodeChange.subscribe((node) => emitted.push(node));
    component.ngOnChanges({ node: new SimpleChange(null, component.node, true) });

    component.updateConfig('{bad');

    expect(emitted).toEqual([]);
    expect(component.jsonError).toBe('workflowStudio.bpmn.drawer.invalidJson');
  });
});

function sampleNode(): BpmnWorkflowNode {
  return {
    id: 'ai',
    type: 'AI_TASK',
    name: 'AI review',
    config: {},
    inputMapping: {},
    outputMapping: {},
    retryPolicy: { maxAttempts: 1 },
    timeoutPolicy: { timeoutSeconds: 30 },
  };
}
