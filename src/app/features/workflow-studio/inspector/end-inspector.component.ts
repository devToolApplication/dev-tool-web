import { Component, Input } from '@angular/core';

import { EndWorkflowNode } from '../model/workflow-studio.model';

@Component({
  selector: 'app-end-inspector',
  standalone: false,
  templateUrl: './static-node-inspector.component.html',
  styleUrl: './static-node-inspector.component.css',
})
export class EndInspectorComponent {
  @Input({ required: true }) node!: EndWorkflowNode;
  @Input() readonly = false;
}
