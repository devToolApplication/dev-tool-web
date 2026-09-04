import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, PageMetadata } from '@core/http/base-response.model';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import {
  buildWorkflowRunFilterFields,
  buildWorkflowRunListActions,
  buildWorkflowRunTableConfig,
} from '../model/workflow-run.config';
import { WorkflowDefinition, WorkflowRun } from '../model/workflow-studio.model';
import { WorkflowRunTriggerDialogComponent } from './workflow-run-trigger-dialog.component';

@Component({
  selector: 'app-workflow-run-list-page',
  standalone: false,
  templateUrl: './workflow-run-list-page.component.html',
  styleUrl: './workflow-run-list-page.component.css',
})
export class WorkflowRunListPageComponent implements OnInit {
  @ViewChild('triggerDialog') triggerDialog?: WorkflowRunTriggerDialogComponent;

  private readonly api = inject(WorkflowApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tableConfig = buildWorkflowRunTableConfig();
  readonly actions = buildWorkflowRunListActions();
  readonly runs = signal<WorkflowRun[]>([]);
  readonly workflows = signal<WorkflowDefinition[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  selectedWorkflowId: string | null = null;
  selectedStatus: string | null = null;

  filterFields = signal(buildWorkflowRunFilterFields([]));

  ngOnInit(): void {
    void this.loadWorkflows();
    void this.loadRuns();
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.runs().length;
  }

  currentPage(): number {
    return this.metadata().currentPage ?? this.metadata().pageNumber ?? 0;
  }

  rows(): number {
    return this.metadata().size ?? this.metadata().pageSize ?? 20;
  }

  async loadWorkflows(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getWorkflowPage({ size: 100 }));
      this.workflows.set(response.data || []);
      this.filterFields.set(buildWorkflowRunFilterFields(this.workflows()));
    } catch {
      // ignore
    }
  }

  async loadRuns(page = 0, size = 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.api.getRunPage({
          page,
          size,
          workflowId: this.selectedWorkflowId || undefined,
          status: (this.selectedStatus as any) || undefined,
        })
      );
      this.runs.set(response.data || []);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.selectedWorkflowId = (filters['workflowId'] as string) || null;
    this.selectedStatus = (filters['status'] as string) || null;
    void this.loadRuns(0, this.rows());
  }

  onFilterReset(): void {
    this.selectedWorkflowId = null;
    this.selectedStatus = null;
    void this.loadRuns(0, this.rows());
  }

  onToolbarAction(action: { id: string }): void {
    switch (action.id) {
      case 'trigger':
        this.triggerDialog?.open(this.selectedWorkflowId || undefined);
        break;
      case 'refresh':
        void this.loadRuns(this.currentPage(), this.rows());
        break;
      default:
        break;
    }
  }

  openDebugger(run: WorkflowRun): void {
    void this.router.navigate([run.id], { relativeTo: this.route });
  }

  onRunStarted(run: WorkflowRun): void {
    this.openDebugger(run);
  }

  onTableAction(event: { action: TableAction<WorkflowRun>; row: WorkflowRun }): void {
    if (event.action.id === 'debug') {
      this.openDebugger(event.row);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}
