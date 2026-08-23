import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, PageMetadata } from '@core/http/base-response.model';
import type { SelectOption } from '@shared/ui/primitives/select/select';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { buildWorkflowRunListTable } from '../model/workflow-lifecycle.config';
import { WorkflowRun, WorkflowRunStatus } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-run-list-page',
  standalone: false,
  templateUrl: './workflow-run-list-page.component.html',
  styleUrl: './workflow-run-list-page.component.css',
})
export class WorkflowRunListPageComponent implements OnInit {
  private readonly api = inject(WorkflowApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tableConfig = buildWorkflowRunListTable();
  readonly statusFilterId = 'workflow-run-status-filter';
  readonly statusOptions: SelectOption[] = [
    { label: 'workflowStudio.runtime.status.all', value: null },
    { label: 'workflowStudio.runtime.status.pending', value: 'PENDING' },
    { label: 'workflowStudio.runtime.status.running', value: 'RUNNING' },
    { label: 'workflowStudio.runtime.status.waitingExternal', value: 'WAITING_EXTERNAL' },
    { label: 'workflowStudio.runtime.status.completed', value: 'COMPLETED' },
    { label: 'workflowStudio.runtime.status.error', value: 'ERROR' },
    { label: 'workflowStudio.runtime.status.timedOut', value: 'TIMED_OUT' },
    { label: 'workflowStudio.runtime.status.cancelled', value: 'CANCELLED' },
  ];
  readonly runs = signal<WorkflowRun[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly workflowIdFilter = signal<string | null>(null);
  readonly statusFilter = signal<WorkflowRunStatus | null>(null);

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.workflowIdFilter.set(query.get('workflowId'));
    this.statusFilter.set(normalizeRunStatus(query.get('status')));
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

  async loadRuns(page = 0, size = 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.api.getRunPage({
        page,
        size,
        sort: ['startedAt,desc'],
        workflowId: this.workflowIdFilter() ?? undefined,
        status: this.statusFilter() ?? undefined,
      }));
      this.runs.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  setStatusFilter(value: string | number | boolean | null): void {
    this.statusFilter.set(typeof value === 'string' ? normalizeRunStatus(value) : null);
    void this.loadRuns(0, this.rows());
  }

  openRun(run: WorkflowRun): void {
    void this.router.navigate(['/ai-agent-mcrs/workflow-runs', run.id]);
  }

  async retryRun(run: WorkflowRun): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const retried = await firstValueFrom(this.api.retryRun(run.id));
      await this.router.navigate(['/ai-agent-mcrs/workflow-runs', retried.id]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onTableAction(event: { action: TableAction<WorkflowRun>; row: WorkflowRun }): void {
    switch (event.action.id) {
      case 'detail':
        this.openRun(event.row);
        break;
      case 'retry':
        void this.retryRun(event.row);
        break;
      default:
        break;
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}

function normalizeRunStatus(value: string | null): WorkflowRunStatus | null {
  const statuses: WorkflowRunStatus[] = [
    'PENDING',
    'RUNNING',
    'WAITING_EXTERNAL',
    'COMPLETED',
    'ERROR',
    'TIMED_OUT',
    'CANCELLED',
  ];

  return statuses.includes(value as WorkflowRunStatus) ? value as WorkflowRunStatus : null;
}
