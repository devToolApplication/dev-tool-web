import { Component, Input } from '@angular/core';

import { StartWorkflowNode, WorkflowNodeExecutionStatus, WorkflowValidationSeverity } from '../model/workflow-studio.model';
import { workflowNodeView } from '../model/workflow-node-catalog';

@Component({
  selector: 'app-start-node',
  standalone: false,
  template: '<app-workflow-node-shell [view]="view()" />',
})
export class StartNodeComponent {
  @Input({ required: true }) node!: StartWorkflowNode;
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
