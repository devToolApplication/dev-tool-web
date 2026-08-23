import { Component, Input } from '@angular/core';

import { AiGateWorkflowNode, WorkflowNodeExecutionStatus, WorkflowValidationSeverity } from '../model/workflow-studio.model';
import { workflowNodeView } from '../model/workflow-node-catalog';

@Component({
  selector: 'app-ai-gate-node',
  standalone: false,
  template: '<app-workflow-node-shell [view]="view()" />',
})
export class AiGateNodeComponent {
  @Input({ required: true }) node!: AiGateWorkflowNode;
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
