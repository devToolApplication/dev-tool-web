import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, PageMetadata } from '@core/http/base-response.model';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { buildWorkflowListActions, buildWorkflowListTable } from '../model/workflow-lifecycle.config';
import { JsonValue, WorkflowDefinition } from '../model/workflow-studio.model';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';

@Component({
  selector: 'app-workflow-list-page',
  standalone: false,
  templateUrl: './workflow-list-page.component.html',
  styleUrl: './workflow-list-page.component.css',
})
export class WorkflowListPageComponent implements OnInit {
  private readonly api = inject(WorkflowApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly persistence = inject(WorkflowPersistenceService);

  readonly tableConfig = buildWorkflowListTable();
  readonly actions = buildWorkflowListActions();
  readonly workflows = signal<WorkflowDefinition[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly runDialogOpen = signal(false);
  readonly running = signal(false);
  readonly selectedWorkflow = signal<WorkflowDefinition | null>(null);

  ngOnInit(): void {
    void this.loadWorkflows();
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.workflows().length;
  }

  currentPage(): number {
    return this.metadata().currentPage ?? this.metadata().pageNumber ?? 0;
  }

  rows(): number {
    return this.metadata().size ?? this.metadata().pageSize ?? 20;
  }

  async loadWorkflows(page = 0, size = 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.api.getWorkflowPage({ page, size, sort: ['name,asc'] }));
      this.workflows.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onToolbarAction(action: { id: string }): void {
    switch (action.id) {
      case 'create':
        void this.router.navigate(['create'], { relativeTo: this.route });
        break;
      case 'refresh':
        void this.loadWorkflows(this.currentPage(), this.rows());
        break;
      default:
        break;
    }
  }

  openBuilder(workflow: WorkflowDefinition): void {
    void this.router.navigate([workflow.id, 'edit'], { relativeTo: this.route });
  }

  openRunDialog(workflow: WorkflowDefinition): void {
    this.selectedWorkflow.set(workflow);
    this.runDialogOpen.set(true);
  }

  closeRunDialog(): void {
    this.runDialogOpen.set(false);
    this.selectedWorkflow.set(null);
  }

  async startRun(input: JsonValue): Promise<void> {
    const workflow = this.selectedWorkflow();
    if (!workflow) {
      return;
    }

    this.running.set(true);
    try {
      const run = await firstValueFrom(this.api.startWorkflow(workflow.id, input));
      this.runDialogOpen.set(false);
      await this.router.navigate(['/ai-agent-mcrs/workflow-runs', run.id]);
    } finally {
      this.running.set(false);
    }
  }

  async publishWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const detail = await firstValueFrom(this.api.getWorkflowDetail(workflow.id));
      await this.persistence.publishDetail(detail);
      await this.loadWorkflows(this.currentPage(), this.rows());
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onTableAction(event: { action: TableAction; row: WorkflowDefinition }): void {
    switch (event.action.id) {
      case 'edit':
        this.openBuilder(event.row);
        break;
      case 'run':
        this.openRunDialog(event.row);
        break;
      case 'publish':
        void this.publishWorkflow(event.row);
        break;
      case 'runs':
        void this.router.navigate(['/ai-agent-mcrs/workflow-runs'], {
          queryParams: { workflowId: event.row.id },
        });
        break;
      default:
        break;
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'workflowStudio.lifecycle.operationFailed';
}
