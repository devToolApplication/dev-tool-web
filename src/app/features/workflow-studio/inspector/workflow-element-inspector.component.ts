import { Component, EventEmitter, Input, Output } from '@angular/core';

import { WorkflowEdge, WorkflowNode } from '../model/workflow-studio.model';

export type WorkflowSelectedElement =
  | { kind: 'node'; value: WorkflowNode }
  | { kind: 'edge'; value: WorkflowEdge }
  | null;

@Component({
  selector: 'app-workflow-element-inspector',
  standalone: false,
  templateUrl: './workflow-element-inspector.component.html',
})
export class WorkflowElementInspectorComponent {
  @Input() selectedElement: WorkflowSelectedElement = null;
  @Input() readonly = false;

  @Output() readonly deleteRequested = new EventEmitter<void>();

  get selectedNode(): WorkflowNode | null {
    return this.selectedElement?.kind === 'node' ? this.selectedElement.value : null;
  }

  get selectedEdge(): WorkflowEdge | null {
    return this.selectedElement?.kind === 'edge' ? this.selectedElement.value : null;
  }
}