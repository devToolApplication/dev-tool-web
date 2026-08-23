import { EventEmitter } from '@angular/core';
import type { FormConfig, FormContext } from '@shared/ui/patterns/form-input/models/form-config.model';

import type { WorkflowNode } from '../model/workflow-studio.model';
import {
  WORKFLOW_NODE_INSPECTOR_CONTEXT,
  workflowNodePatchFromInspectorValue,
  workflowNodeToInspectorValue,
} from './workflow-node-inspector.model';

export abstract class WorkflowNodeFormInspector<TNode extends WorkflowNode> {
  abstract node: TNode;
  readonly = false;
  abstract readonly nodePatch: EventEmitter<Partial<TNode>>;
  abstract readonly config: FormConfig;

  private initialValueNodeId: string | null = null;
  private stableInitialValue: Record<string, unknown> = {};

  get formContext(): FormContext {
    return { ...WORKFLOW_NODE_INSPECTOR_CONTEXT, mode: this.readonly ? 'view' : 'edit' };
  }

  get initialValue(): Record<string, unknown> {
    if (!this.node || this.initialValueNodeId !== this.node.id) {
      this.initialValueNodeId = this.node?.id ?? null;
      this.stableInitialValue = this.node ? workflowNodeToInspectorValue(this.node) : {};
    }
    return this.stableInitialValue;
  }

  formValueChange(value: Record<string, unknown>): void {
    const patch = workflowNodePatchFromInspectorValue(this.node, value);
    if (!patch) {
      return;
    }
    Object.assign(this.stableInitialValue, value);
    this.nodePatch.emit(patch as Partial<TNode>);
  }
}
