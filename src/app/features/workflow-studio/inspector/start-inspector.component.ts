import { Component, Input } from '@angular/core';

import { StartWorkflowNode } from '../model/workflow-studio.model';

@Component({
  selector: 'app-start-inspector',
  standalone: false,
  templateUrl: './static-node-inspector.component.html',
  styleUrl: './static-node-inspector.component.css',
})
export class StartInspectorComponent {
  @Input({ required: true }) node!: StartWorkflowNode;
  @Input() readonly = false;
}
