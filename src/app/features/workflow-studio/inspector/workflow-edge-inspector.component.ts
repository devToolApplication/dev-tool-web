import { Component, EventEmitter, Input, Output } from '@angular/core';

import { WorkflowEdge } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-edge-inspector',
  standalone: false,
  templateUrl: './workflow-edge-inspector.component.html',
  styleUrl: './workflow-edge-inspector.component.css',
})
export class WorkflowEdgeInspectorComponent {
  @Input({ required: true }) edge!: WorkflowEdge;
  @Input() readonly = false;

  @Output() readonly deleteRequested = new EventEmitter<void>();

  requestDelete(): void {
    if (this.readonly) {
      return;
    }
    this.deleteRequested.emit();
  }
}

