import { Component, computed, inject } from '@angular/core';

import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  EndWorkflowNode,
  LogicWorkflowNode,
  StartWorkflowNode,
  WorkflowNode,
} from '../model/workflow-studio.model';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Component({
  selector: 'app-workflow-node-inspector',
  standalone: false,
  templateUrl: './workflow-node-inspector.component.html',
  styleUrl: './workflow-node-inspector.component.css',
})
export class WorkflowNodeInspectorComponent {
  private readonly editorStore = inject(WorkflowEditorStore);

  readonly selectedNode = computed(() => {
    const selectedNodeId = this.editorStore.selectedNodeId();
    return this.editorStore.nodes().find((node) => node.id === selectedNodeId) ?? null;
  });
  readonly readonlyMode = computed(() => this.editorStore.mode() !== 'design');

  applyNodePatch(patch: Partial<WorkflowNode>): void {
    const node = this.selectedNode();
    if (!node) {
      return;
    }
    this.editorStore.updateNodePatch(node.id, patch);
  }

  asAiGateNode(node: WorkflowNode): AiGateWorkflowNode {
    return node as AiGateWorkflowNode;
  }

  asCodeGateNode(node: WorkflowNode): CodeGateWorkflowNode {
    return node as CodeGateWorkflowNode;
  }

  asLogicNode(node: WorkflowNode): LogicWorkflowNode {
    return node as LogicWorkflowNode;
  }

  asStartNode(node: WorkflowNode): StartWorkflowNode {
    return node as StartWorkflowNode;
  }

  asEndNode(node: WorkflowNode): EndWorkflowNode {
    return node as EndWorkflowNode;
  }
}
