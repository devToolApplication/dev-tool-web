import { Component, Input } from '@angular/core';

import { WorkflowNodeView } from '../model/workflow-node-catalog';

@Component({
  selector: 'app-workflow-node-shell',
  standalone: false,
  templateUrl: './workflow-node-shell.component.html',
  styleUrls: ['./workflow-node-shell.component.css'],
})
export class WorkflowNodeShellComponent {
  @Input({ required: true }) view!: WorkflowNodeView;
}
