import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';

import { WorkflowValidationIssue } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-problems-panel',
  standalone: false,
  templateUrl: './workflow-problems-panel.component.html',
  styleUrls: ['./workflow-problems-panel.component.css'],
})
export class WorkflowProblemsPanelComponent implements OnChanges {
  @Input() issues: WorkflowValidationIssue[] = [];

  @Output() readonly issueSelected = new EventEmitter<WorkflowValidationIssue>();

  readonly collapsed = signal(true);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['issues']) {
      const current = this.issues ?? [];
      const previous = (changes['issues'].previousValue as WorkflowValidationIssue[] | undefined) ?? [];
      if (current.length === 0) {
        this.collapsed.set(true);
      } else if (previous.length === 0 || !this.sameIssues(previous, current)) {
        this.collapsed.set(false);
      }
    }
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  trackIssue(index: number, issue: WorkflowValidationIssue): string {
    return `${issue.code}:${issue.nodeId ?? issue.edgeId ?? index}:${issue.field ?? ''}`;
  }

  selectIssue(issue: WorkflowValidationIssue): void {
    this.issueSelected.emit(issue);
  }

  private sameIssues(a: WorkflowValidationIssue[], b: WorkflowValidationIssue[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => {
      const other = b[idx];
      return (
        item.code === other.code &&
        item.nodeId === other.nodeId &&
        item.edgeId === other.edgeId &&
        item.field === other.field &&
        item.severity === other.severity
      );
    });
  }
}