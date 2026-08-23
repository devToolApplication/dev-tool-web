import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { FormConfig } from '@shared/ui/patterns/form-input/models/form-config.model';

import { AiGateWorkflowNode } from '../model/workflow-studio.model';
import {
  workflowNodeInspectorConfig,
} from './workflow-node-inspector.model';
import { WorkflowNodeFormInspector } from './workflow-node-form-inspector.base';

@Component({
  selector: 'app-ai-gate-inspector',
  standalone: false,
  templateUrl: './workflow-node-form-inspector.component.html',
})
export class AiGateInspectorComponent extends WorkflowNodeFormInspector<AiGateWorkflowNode> {
  @Input({ required: true }) node!: AiGateWorkflowNode;
  @Input() override readonly = false;

  @Output() override readonly nodePatch = new EventEmitter<Partial<AiGateWorkflowNode>>();

  override readonly config: FormConfig = workflowNodeInspectorConfig('AI_GATE');
}
