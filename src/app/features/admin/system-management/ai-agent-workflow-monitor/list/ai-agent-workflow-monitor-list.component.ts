import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AiAgentWorkflowRunService } from '../../../../../core/services/ai-agent-service/ai-agent-workflow-run.service';
import { AiAgentWorkflowRunResponse, WORKFLOW_RUN_STATUS_CONFIG, WorkflowRunStatus } from '../../../../../core/models/ai-agent/ai-agent-workflow-run.model';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { AI_AGENT_WORKFLOW_MONITOR_ROUTES } from '../ai-agent-workflow-monitor.constants';
import { BadgeVariant } from '../../../../../shared/ui/data-display/badge/badge.component';

const VALID_STATUSES: WorkflowRunStatus[] = ['RUNNING', 'WAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED'];

@Component({
  selector: 'app-ai-agent-workflow-monitor-list',
  standalone: false,
  templateUrl: './ai-agent-workflow-monitor-list.component.html',
  styleUrl: './ai-agent-workflow-monitor-list.component.scss'
})
export class AiAgentWorkflowMonitorListComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly runService = inject(AiAgentWorkflowRunService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly runs = signal<AiAgentWorkflowRunResponse[]>([]);
  readonly loading = signal(false);
  readonly statusFilter = signal<WorkflowRunStatus | ''>('');
  readonly statusConfig = WORKFLOW_RUN_STATUS_CONFIG;

  readonly isInboxMode = computed(() => this.statusFilter() === 'WAITING_REVIEW');

  readonly statusOptions: { label: string; value: WorkflowRunStatus | '' }[] = [
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.all', value: '' },
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.running', value: 'RUNNING' },
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.waitingReview', value: 'WAITING_REVIEW' },
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.completed', value: 'COMPLETED' },
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.failed', value: 'FAILED' },
    { label: 'systemManagement.aiAgentWorkflowMonitor.filter.cancelled', value: 'CANCELLED' }
  ];

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const queryStatus = params.get('status');
        const resolved = (queryStatus && VALID_STATUSES.includes(queryStatus as WorkflowRunStatus))
          ? queryStatus as WorkflowRunStatus
          : '';
        this.statusFilter.set(resolved);
        this.loadRuns();
      });
  }

  loadRuns(): void {
    this.loading.set(true);
    const filters: Record<string, any> = {};
    if (this.statusFilter()) {
      filters['status'] = this.statusFilter();
    }

    this.runService.getPage(0, 20, ['createdAt,desc'], filters).subscribe({
      next: (page) => {
        this.runs.set(page.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('systemManagement.aiAgentWorkflowMonitor.toast.loadFailed');
      }
    });
  }

  onStatusFilterChange(status: WorkflowRunStatus | ''): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  openRunDetail(run: AiAgentWorkflowRunResponse): void {
    void this.router.navigate([AI_AGENT_WORKFLOW_MONITOR_ROUTES.detail, run.id]);
  }

  getStatusBadgeVariant(status: WorkflowRunStatus): BadgeVariant {
    const severity = this.statusConfig[status]?.severity || 'default';
    if (severity === 'secondary') return 'muted';
    if (['info', 'success', 'warning', 'danger'].includes(severity)) return severity as BadgeVariant;
    return 'default';
  }

  getStatusIcon(status: WorkflowRunStatus): string {
    return this.statusConfig[status]?.icon || 'pi pi-circle';
  }

  getStatusI18nKey(status: WorkflowRunStatus): string {
    return `systemManagement.aiAgentWorkflowMonitor.status.${status}`;
  }

  isActionRequired(run: AiAgentWorkflowRunResponse): boolean {
    return run.status === 'WAITING_REVIEW';
  }
}
