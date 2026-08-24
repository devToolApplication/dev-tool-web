import { SimpleChange } from '@angular/core';

import { WorkflowBpmnSequenceFlowDrawerComponent } from './workflow-bpmn-sequence-flow-drawer.component';
import type { WorkflowEdge } from '../model/workflow-studio.model';

describe('WorkflowBpmnSequenceFlowDrawerComponent', () => {
  it('emits sequence flow name, default flag and structured compare condition', () => {
    const component = new WorkflowBpmnSequenceFlowDrawerComponent();
    const emitted: WorkflowEdge[] = [];
    component.edge = { id: 'flow-1', source: 'xor', target: 'ai', defaultFlow: false };
    component.edgeChange.subscribe((edge) => emitted.push(edge));
    component.ngOnChanges({ edge: new SimpleChange(null, component.edge, true) });

    component.updateName('Pass');
    component.updateDefaultFlow(true);
    component.updateLeftPath('input.candidate.followers');
    component.updateOperator('GTE');
    component.updateRightLiteral('1000');

    expect(emitted.at(-1)).toEqual({
      id: 'flow-1',
      source: 'xor',
      target: 'ai',
      name: 'Pass',
      defaultFlow: true,
      condition: {
        type: 'COMPARE',
        left: { path: 'input.candidate.followers' },
        operator: 'GTE',
        right: { literal: 1000 },
      },
    });
  });

  it('rejects arbitrary invalid JSON for condition literals', () => {
    const component = new WorkflowBpmnSequenceFlowDrawerComponent();
    const emitted: WorkflowEdge[] = [];
    component.edge = { id: 'flow-1', source: 'xor', target: 'ai' };
    component.edgeChange.subscribe((edge) => emitted.push(edge));
    component.ngOnChanges({ edge: new SimpleChange(null, component.edge, true) });

    component.updateLeftPath('input.score');
    emitted.length = 0;
    component.updateRightLiteral('{bad');

    expect(emitted).toEqual([]);
    expect(component.jsonError).toBe('workflowStudio.bpmn.drawer.invalidJson');
  });
});
