import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval, firstValueFrom } from 'rxjs';

import { normalizePageMetadata, PageMetadata } from '@core/http/base-response.model';
import { ToastService } from '@core/notifications/toast.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import {
  buildWorkflowTaskFilterFields,
  buildWorkflowTaskListActions,
  buildWorkflowTaskTableConfig,
} from '../model/workflow-task.config';
import { WorkflowDefinition, WorkflowTask } from '../model/workflow-studio.model';

@Component({
  selector: 'app-workflow-task-list-page',
  standalone: false,
  templateUrl: './workflow-task-list-page.component.html',
  styleUrl: './workflow-task-list-page.component.css',
})
export class WorkflowTaskListPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(WorkflowApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly keycloak = inject(KeycloakService);

  readonly tableConfig = buildWorkflowTaskTableConfig();
  readonly actions = signal(buildWorkflowTaskListActions(false));
  readonly tasks = signal<WorkflowTask[]>([]);
  readonly workflows = signal<WorkflowDefinition[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedTask = signal<WorkflowTask | null>(null);
  readonly drawerOpen = signal(false);
  readonly completing = signal(false);
  readonly claiming = signal(false);
  readonly variableOverrideText = signal('');
  readonly pollingActive = signal(false);

  private pollingSub?: Subscription;

  selectedWorkflowId: string | null = null;
  selectedAssignee: string | null = null;
  selectedAssignmentStatus: string = 'all';

  filterFields = signal(buildWorkflowTaskFilterFields([]));

  ngOnInit(): void {
    void this.loadWorkflows();
    void this.loadTasks();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get currentUsername(): string {
    return (this.keycloak.userInfo as Record<string, any> | undefined)?.['preferred_username'] || 'dev-user';
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.tasks().length;
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
      this.filterFields.set(buildWorkflowTaskFilterFields(this.workflows()));
    } catch {
      // ignore
    }
  }

  async loadTasks(page = 0, size = 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      let assigneeParam: string | undefined = undefined;
      let unassignedOnlyParam: boolean | undefined = undefined;

      if (this.selectedAssignmentStatus === 'unassigned') {
        unassignedOnlyParam = true;
      } else if (this.selectedAssignmentStatus === 'myTasks') {
        assigneeParam = this.currentUsername;
      } else if (this.selectedAssignee) {
        assigneeParam = this.selectedAssignee;
      }

      const response = await firstValueFrom(
        this.api.getTasksPage({
          page,
          size,
          workflowId: this.selectedWorkflowId || undefined,
          assignee: assigneeParam,
          unassignedOnly: unassignedOnlyParam,
        })
      );
      this.tasks.set(response.data || []);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (err) {
      this.error.set(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.selectedWorkflowId = (filters['workflowId'] as string) || null;
    this.selectedAssignee = (filters['assignee'] as string) || null;
    this.selectedAssignmentStatus = (filters['assignmentStatus'] as string) || 'all';
    void this.loadTasks(0, this.rows());
  }

  onFilterReset(): void {
    this.selectedWorkflowId = null;
    this.selectedAssignee = null;
    this.selectedAssignmentStatus = 'all';
    void this.loadTasks(0, this.rows());
  }

  onToolbarAction(action: { id: string }): void {
    if (action.id === 'refresh') {
      void this.loadTasks(this.currentPage(), this.rows());
    } else if (action.id === 'polling') {
      this.togglePolling();
    }
  }

  togglePolling(): void {
    this.pollingActive.update((active) => !active);
    this.actions.set(buildWorkflowTaskListActions(this.pollingActive()));
    if (this.pollingActive()) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  startPolling(): void {
    if (this.pollingSub) {
      return;
    }
    this.pollingSub = interval(5000).subscribe(() => {
      void this.loadTasks(this.currentPage(), this.rows());
    });
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  async claimTask(task: WorkflowTask): Promise<void> {
    this.claiming.set(true);
    try {
      await firstValueFrom(this.api.claimTask(task.id, this.currentUsername));
      this.toast.success('workflowStudio.lifecycle.taskClaimSuccess');
      if (this.selectedTask()?.id === task.id) {
        this.selectedTask.set({ ...task, assignee: this.currentUsername });
      }
      await this.loadTasks(this.currentPage(), this.rows());
    } catch (err) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.claiming.set(false);
    }
  }

  async unclaimTask(task: WorkflowTask): Promise<void> {
    this.claiming.set(true);
    try {
      await firstValueFrom(this.api.unclaimTask(task.id));
      this.toast.success('workflowStudio.lifecycle.taskUnclaimSuccess');
      if (this.selectedTask()?.id === task.id) {
        this.selectedTask.set({ ...task, assignee: null });
      }
      await this.loadTasks(this.currentPage(), this.rows());
    } catch (err) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.claiming.set(false);
    }
  }

  onTableAction(event: { action: TableAction<WorkflowTask>; row: WorkflowTask }): void {
    switch (event.action.id) {
      case 'claim':
        void this.claimTask(event.row);
        break;
      case 'unclaim':
        void this.unclaimTask(event.row);
        break;
      case 'handle':
        this.openDrawer(event.row);
        break;
      case 'navigate':
        this.navigateToForm(event.row);
        break;
      case 'complete':
        this.openDrawer(event.row);
        break;
      default:
        break;
    }
  }

  openDrawer(task: WorkflowTask): void {
    this.selectedTask.set(task);
    if (task.variables && Object.keys(task.variables).length > 0) {
      this.variableOverrideText.set(JSON.stringify(task.variables, null, 2));
    } else {
      this.variableOverrideText.set('');
    }
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedTask.set(null);
    this.variableOverrideText.set('');
  }

  navigateToForm(task: WorkflowTask): void {
    if (task.formKey && task.formKey.startsWith('/')) {
      void this.router.navigate([task.formKey], {
        queryParams: { taskId: task.id, runId: task.processInstanceId },
      });
    }
  }

  onVariableOverrideChange(value: string | null): void {
    this.variableOverrideText.set(value ?? '');
  }

  async completeTask(): Promise<void> {
    const task = this.selectedTask();
    if (!task) {
      return;
    }

    let payloadVariables: Record<string, unknown> = { approved: true };
    const rawOverride = this.variableOverrideText().trim();
    if (rawOverride) {
      try {
        const parsed = JSON.parse(rawOverride);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          payloadVariables = parsed;
        } else {
          this.toast.error('workflowStudio.bpmn.drawer.invalidJson');
          return;
        }
      } catch {
        this.toast.error('workflowStudio.bpmn.drawer.invalidJson');
        return;
      }
    } else if (task.variables && Object.keys(task.variables).length > 0) {
      payloadVariables = { ...task.variables };
    }

    this.completing.set(true);
    try {
      await firstValueFrom(this.api.completeTask(task.id, payloadVariables));
      this.toast.success('workflowStudio.lifecycle.taskCompleteSuccess');
      this.closeDrawer();
      await this.loadTasks(this.currentPage(), this.rows());
    } catch (err) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.completing.set(false);
    }
  }

  priorityBadgeVariant(priority: number | null | undefined): 'info' | 'warning' | 'danger' {
    const p = priority ?? 25;
    if (p < 25) return 'info';
    if (p < 50) return 'warning';
    return 'danger';
  }

  priorityLabel(priority: number | null | undefined): string {
    const p = priority ?? 25;
    if (p < 25) return `Low (${p})`;
    if (p < 50) return `Normal (${p})`;
    return `High (${p})`;
  }
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const obj = error as { error?: { errorMessage?: string; message?: string }; errorMessage?: string; message?: string };
    if (obj.error?.errorMessage) return obj.error.errorMessage;
    if (obj.error?.message) return obj.error.message;
    if (obj.errorMessage) return obj.errorMessage;
    if (obj.message) return obj.message;
  }
  return typeof error === 'string' ? error : 'workflowStudio.lifecycle.operationFailed';
}
