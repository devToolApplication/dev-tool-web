import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowDefinition, WorkflowRun } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-run-trigger-dialog',
  standalone: false,
  templateUrl: './workflow-run-trigger-dialog.component.html',
  styleUrl: './workflow-run-trigger-dialog.component.css',
})
export class WorkflowRunTriggerDialogComponent {
  @Output() readonly runStarted = new EventEmitter<WorkflowRun>();

  visible = false;
  loading = false;
  submitting = false;
  jsonError: string | null = null;
  workflows: WorkflowDefinition[] = [];

  readonly form: FormGroup;

  constructor(
    private readonly apiService: WorkflowApiService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      workflowId: ['', [Validators.required]],
      inputPayload: ['{\n  \n}', [Validators.required]],
    });
  }

  open(workflowId?: string): void {
    this.visible = true;
    this.jsonError = null;
    this.form.reset({
      workflowId: workflowId || '',
      inputPayload: '{\n  \n}',
    });
    this.loadWorkflows();
  }

  close(): void {
    this.visible = false;
    this.jsonError = null;
  }

  loadWorkflows(): void {
    this.loading = true;
    this.apiService.getWorkflowPage({ size: 100 }).subscribe({
      next: (res) => {
        this.workflows = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { workflowId, inputPayload } = this.form.value;
    let parsedInput = {};
    try {
      parsedInput = JSON.parse(inputPayload || '{}');
      this.jsonError = null;
    } catch {
      this.jsonError = 'workflowStudio.lifecycle.runInvalidJson';
      return;
    }

    this.submitting = true;
    this.apiService.startWorkflow(workflowId, parsedInput).subscribe({
      next: (run) => {
        this.submitting = false;
        this.visible = false;
        this.runStarted.emit(run);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
