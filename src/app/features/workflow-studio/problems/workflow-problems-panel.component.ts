import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';

import { WorkflowValidationIssue } from '../model/workflow-studio.model';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

@Component({
  selector: 'app-workflow-problems-panel',
  standalone: false,
  templateUrl: './workflow-problems-panel.component.html',
  styleUrls: ['./workflow-problems-panel.component.css'],
})
export class WorkflowProblemsPanelComponent {
  private readonly editorStore = inject(WorkflowEditorStore, { optional: true });

  @Input() issues: WorkflowValidationIssue[] = [];

  @Output() readonly issueSelected = new EventEmitter<WorkflowValidationIssue>();

  readonly collapsed = signal(false);

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  trackIssue(index: number, issue: WorkflowValidationIssue): string {
    return `${issue.code}:${issue.nodeId ?? issue.edgeId ?? index}:${issue.field ?? ''}`;
  }

  selectIssue(issue: WorkflowValidationIssue): void {
    this.editorStore?.selectValidationIssue(issue);
    this.issueSelected.emit(issue);
  }
}
