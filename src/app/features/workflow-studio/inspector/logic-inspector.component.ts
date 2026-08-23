import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { FormConfig } from '@shared/ui/patterns/form-input/models/form-config.model';

import { LogicWorkflowNode } from '../model/workflow-studio.model';
import {
  workflowNodeInspectorConfig,
} from './workflow-node-inspector.model';
import { WorkflowNodeFormInspector } from './workflow-node-form-inspector.base';

@Component({
  selector: 'app-logic-inspector',
  standalone: false,
  templateUrl: './workflow-node-form-inspector.component.html',
})
export class LogicInspectorComponent extends WorkflowNodeFormInspector<LogicWorkflowNode> {
  @Input({ required: true }) node!: LogicWorkflowNode;
  @Input() override readonly = false;

  @Output() override readonly nodePatch = new EventEmitter<Partial<LogicWorkflowNode>>();

  override readonly config: FormConfig = workflowNodeInspectorConfig('LOGIC');
}
