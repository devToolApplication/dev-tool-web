import { Component, Input } from '@angular/core';

import { EndWorkflowNode, WorkflowNodeExecutionStatus, WorkflowValidationSeverity } from '../model/workflow-studio.model';
import { workflowNodeView } from '../model/workflow-node-catalog';

@Component({
  selector: 'app-end-node',
  standalone: false,
  template: '<app-workflow-node-shell [view]="view()" />',
})
export class EndNodeComponent {
  @Input({ required: true }) node!: EndWorkflowNode;
  @Input() selected = false;
  @Input() runtimeStatus: WorkflowNodeExecutionStatus | null = null;
  @Input() validationSeverity: WorkflowValidationSeverity | null = null;

  view() {
    return workflowNodeView(this.node, {
      selected: this.selected,
      runtimeStatus: this.runtimeStatus,
      validationSeverity: this.validationSeverity,
    });
  }
}
