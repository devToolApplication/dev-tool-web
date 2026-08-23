import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { JsonValue } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-run-dialog',
  standalone: false,
  templateUrl: './workflow-run-dialog.component.html',
  styleUrl: './workflow-run-dialog.component.css',
})
export class WorkflowRunDialogComponent {
  @Input() open = false;
  @Input() loading = false;
  @Input() workflowName = '';

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly runRequested = new EventEmitter<JsonValue>();

  readonly inputText = signal('{\n  \n}');
  readonly error = signal<string | null>(null);

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    const parsed = this.parseInput();
    if (parsed === undefined) {
      return;
    }

    this.error.set(null);
    this.runRequested.emit(parsed);
  }

  onInputChange(value: string | null): void {
    this.inputText.set(value ?? '');
    this.error.set(null);
  }

  private parseInput(): JsonValue | undefined {
    try {
      return JSON.parse(this.inputText() || '{}') as JsonValue;
    } catch {
      this.error.set('workflowStudio.lifecycle.runInvalidJson');
      return undefined;
    }
  }
}
