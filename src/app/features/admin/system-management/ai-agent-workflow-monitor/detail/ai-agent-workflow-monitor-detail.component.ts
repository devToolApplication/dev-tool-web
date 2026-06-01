import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval, switchMap, filter } from 'rxjs';
import { AiAgentWorkflowRunService } from '../../../../../core/services/ai-agent-service/ai-agent-workflow-run.service';
import { AiAgentWebSocketService, WebSocketStatusEvent, WebSocketStepResultEvent } from '../../../../../core/services/ai-agent-service/ai-agent-websocket.service';
import { KeycloakService } from '../../../../../core/auth/keycloak.service';
import {
  AiAgentWorkflowRunResponse,
  AiAgentExecutionEventResponse,
  AiAgentWorkflowResultResponse,
  AiAgentReviewDecisionRequest,
  WorkflowRunStatus,
  WORKFLOW_RUN_STATUS_CONFIG
} from '../../../../../core/models/ai-agent/ai-agent-workflow-run.model';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { AI_AGENT_WORKFLOW_MONITOR_ROUTES } from '../ai-agent-workflow-monitor.constants';

export type DetailTab = 'graph' | 'timeline' | 'result';

export interface NodeStatusInfo {
  nodeId: string;
  status: 'not_started' | 'running' | 'success' | 'failed' | 'waiting_review' | 'skipped';
  summary?: string;
  durationMs?: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
  dataJsonPreview?: string;
}

@Component({
  selector: 'app-ai-agent-workflow-monitor-detail',
  standalone: false,
  templateUrl: './ai-agent-workflow-monitor-detail.component.html',
  styleUrl: './ai-agent-workflow-monitor-detail.component.scss'
})
export class AiAgentWorkflowMonitorDetailComponent implements OnInit, OnDestroy {

  // State
  readonly runId = signal<string>('');
  readonly run = signal<AiAgentWorkflowRunResponse | null>(null);
  readonly events = signal<AiAgentExecutionEventResponse[]>([]);
  readonly result = signal<AiAgentWorkflowResultResponse | null>(null);
  readonly activeTab = signal<DetailTab>('graph');
  readonly selectedNodeId = signal<string | null>(null);
  readonly nodeStatuses = signal<Map<string, NodeStatusInfo>>(new Map());
  readonly cancelling = signal(false);
  readonly submittingReview = signal(false);
  readonly reviewComment = signal('');
  readonly reviewDecision = signal<'APPROVE' | 'REJECT' | null>(null);
  readonly wsConnected = signal(false);

  // Computed
  readonly isTerminal = computed(() => {
    const status = this.run()?.status;
    return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';
  });

  readonly isWaitingReview = computed(() => this.run()?.status === 'WAITING_REVIEW');
  readonly canCancel = computed(() => !this.isTerminal() && !this.cancelling());

  readonly selectedNodeInfo = computed(() => {
    const id = this.selectedNodeId();
    if (!id) return null;
    return this.nodeStatuses().get(id) ?? null;
  });

  readonly statusConfig = WORKFLOW_RUN_STATUS_CONFIG;

  private readonly destroy$ = new Subject<void>();
  private pollingActive = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly runService: AiAgentWorkflowRunService,
    private readonly wsService: AiAgentWebSocketService,
    private readonly keycloakService: KeycloakService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Connect WebSocket with Keycloak token
    const token = this.keycloakService.token;
    if (token) {
      this.wsService.connect(token);
    }

    const id = this.route.snapshot.paramMap.get('runId') || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.runId.set(id);
      this.loadRunDetail(id);
      this.loadEvents(id);
      this.setupWebSocket(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.unsubscribeRun(this.runId());
  }

  // --- Actions ---

  switchTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    if (tab === 'result' && !this.result()) {
      this.loadResult();
    }
  }

  selectNode(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);
  }

  cancel(): void {
    if (!this.canCancel()) return;
    this.cancelling.set(true);
    this.runService.cancel(this.runId()).subscribe({
      next: (updated) => {
        this.run.set(updated);
        this.cancelling.set(false);
        this.toastService.success('Workflow run cancelled');
      },
      error: () => {
        this.cancelling.set(false);
        this.toastService.error('Failed to cancel workflow run');
      }
    });
  }

  submitReview(decision: 'APPROVE' | 'REJECT'): void {
    if (decision === 'REJECT' && !this.reviewComment().trim()) {
      this.toastService.info('Comment is required for rejection');
      return;
    }

    this.submittingReview.set(true);
    const payload: AiAgentReviewDecisionRequest = {
      decision,
      comment: this.reviewComment().trim() || undefined
    };

    this.runService.submitReviewDecision(this.runId(), payload).subscribe({
      next: (updated) => {
        this.run.set(updated);
        this.submittingReview.set(false);
        this.reviewComment.set('');
        this.reviewDecision.set(null);
        this.toastService.success(`Review ${decision.toLowerCase()}d successfully`);
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.toastService.error(err?.error?.message || 'Failed to submit review');
      }
    });
  }

  goBack(): void {
    void this.router.navigate([AI_AGENT_WORKFLOW_MONITOR_ROUTES.list]);
  }

  getStatusClass(status: WorkflowRunStatus): string {
    return this.statusConfig[status]?.severity || 'secondary';
  }

  // --- Private ---

  private loadRunDetail(runId: string): void {
    this.loadingService.track(this.runService.getById(runId)).subscribe({
      next: (run) => this.run.set(run),
      error: () => this.toastService.error('Failed to load workflow run')
    });
  }

  private loadEvents(runId: string): void {
    this.runService.getEvents(runId).subscribe({
      next: (events) => {
        this.events.set(events);
        this.buildNodeStatuses(events);
      },
      error: () => {} // Non-critical
    });
  }

  private loadResult(): void {
    this.runService.getResult(this.runId()).subscribe({
      next: (result) => this.result.set(result),
      error: () => {} // May not exist yet
    });
  }

  private setupWebSocket(runId: string): void {
    // Subscribe to status updates
    this.wsService.subscribeRunStatus(runId, (event: WebSocketStatusEvent) => {
      if (event.type === 'RUN_STATUS_CHANGED') {
        this.run.update(r => r ? { ...r, status: event.workflowRunStatus as WorkflowRunStatus, currentNodeId: event.currentNodeId } : r);
      }
      if (event.type === 'NODE_STATUS_CHANGED' && event.nodeId) {
        this.updateNodeStatus(event.nodeId, event.status as string);
      }
      // Reload events for timeline
      this.loadEvents(runId);
    });

    // Subscribe to step results
    this.wsService.subscribeRunResults(runId, (event: WebSocketStepResultEvent) => {
      this.updateNodeResult(event);
    });

    // Fallback polling if WebSocket not connected
    this.startFallbackPolling(runId);
  }

  private startFallbackPolling(runId: string): void {
    interval(3000).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.wsService.connected() && !this.isTerminal())
    ).subscribe(() => {
      this.runService.getById(runId).subscribe({
        next: (run) => {
          this.run.set(run);
          if (this.isTerminal()) {
            this.loadEvents(runId);
            this.loadResult();
          }
        }
      });
    });
  }

  private buildNodeStatuses(events: AiAgentExecutionEventResponse[]): void {
    const statuses = new Map<string, NodeStatusInfo>();
    for (const event of events) {
      if (!event.nodeId) continue;
      const existing = statuses.get(event.nodeId) || { nodeId: event.nodeId, status: 'not_started' as const };

      switch (event.eventType) {
        case 'NODE_STARTED':
          existing.status = 'running';
          break;
        case 'NODE_COMPLETED':
          existing.status = 'success';
          existing.summary = event.safeSummary;
          break;
        case 'NODE_FAILED':
          existing.status = 'failed';
          existing.summary = event.safeSummary;
          break;
        case 'REVIEW_REQUESTED':
          existing.status = 'waiting_review';
          break;
      }
      statuses.set(event.nodeId, existing);
    }
    this.nodeStatuses.set(statuses);
  }

  private updateNodeStatus(nodeId: string, status: string): void {
    this.nodeStatuses.update(map => {
      const newMap = new Map(map);
      const existing = newMap.get(nodeId) || { nodeId, status: 'not_started' as const };
      existing.status = this.mapStatus(status);
      newMap.set(nodeId, existing);
      return newMap;
    });
  }

  private updateNodeResult(event: WebSocketStepResultEvent): void {
    this.nodeStatuses.update(map => {
      const newMap = new Map(map);
      const existing = newMap.get(event.nodeId) || { nodeId: event.nodeId, status: 'not_started' as const };
      existing.status = event.status === 'SUCCESS' ? 'success' : 'failed';
      existing.summary = event.summary;
      existing.durationMs = event.durationMs;
      existing.tokenUsage = event.tokenUsage;
      existing.dataJsonPreview = event.dataJsonPreview;
      newMap.set(event.nodeId, existing);
      return newMap;
    });
  }

  private mapStatus(status: string): NodeStatusInfo['status'] {
    switch (status?.toUpperCase()) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'failed';
      case 'RUNNING': return 'running';
      case 'WAITING_REVIEW': return 'waiting_review';
      default: return 'not_started';
    }
  }
}
