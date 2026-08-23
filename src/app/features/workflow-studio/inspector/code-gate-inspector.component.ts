import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { FormConfig } from '@shared/ui/patterns/form-input/models/form-config.model';

import { CodeGateWorkflowNode } from '../model/workflow-studio.model';
import {
  workflowNodeInspectorConfig,
} from './workflow-node-inspector.model';
import { WorkflowNodeFormInspector } from './workflow-node-form-inspector.base';

@Component({
  selector: 'app-code-gate-inspector',
  standalone: false,
  templateUrl: './workflow-node-form-inspector.component.html',
})
export class CodeGateInspectorComponent extends WorkflowNodeFormInspector<CodeGateWorkflowNode> {
  @Input({ required: true }) node!: CodeGateWorkflowNode;
  @Input() override readonly = false;

  @Output() override readonly nodePatch = new EventEmitter<Partial<CodeGateWorkflowNode>>();

  override readonly config: FormConfig = workflowNodeInspectorConfig('CODE_GATE');
}
