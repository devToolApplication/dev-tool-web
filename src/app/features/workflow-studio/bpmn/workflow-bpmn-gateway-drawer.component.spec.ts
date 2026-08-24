import { SimpleChange } from '@angular/core';

import { WorkflowBpmnGatewayDrawerComponent } from './workflow-bpmn-gateway-drawer.component';
import type { BpmnWorkflowNode } from '../model/workflow-studio.model';

describe('WorkflowBpmnGatewayDrawerComponent', () => {
  it('emits gateway name and config changes as BPMN node patches', () => {
    const component = new WorkflowBpmnGatewayDrawerComponent();
    const emitted: BpmnWorkflowNode[] = [];
    component.node = {
      id: 'xor',
      type: 'EXCLUSIVE_GATEWAY',
      name: 'Branch',
      config: {},
    };
    component.nodeChange.subscribe((node) => emitted.push(node));
    component.ngOnChanges({ node: new SimpleChange(null, component.node, true) });

    component.updateName('Score branch');
    component.updateConfig('{ "mode": "exclusive" }');

    expect(emitted.at(-1)).toMatchObject({
      id: 'xor',
      type: 'EXCLUSIVE_GATEWAY',
      name: 'Score branch',
      config: { mode: 'exclusive' },
    });
  });
});
