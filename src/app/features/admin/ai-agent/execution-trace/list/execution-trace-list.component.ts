import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { ExecutionSessionResponse, ExecutionStepResponse } from '../../../../../core/models/ai-agent/execution-trace.model';
import { ExecutionTraceService } from '../../../../../core/services/ai-agent-service/execution-trace.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BadgeVariant } from '../../../../../shared/ui/data-display/badge/badge.component';
import { KeyValueItem } from '../../../../../shared/ui/data-display/key-value-list/key-value-list.component';
import { TimelineItem } from '../../../../../shared/ui/data-display/timeline/timeline.component';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

interface ExecutionStepTimelineData {
  step: ExecutionStepResponse;
  payload: string;
}

@Component({
  selector: 'app-execution-trace-list',
  standalone: false,
  templateUrl: './execution-trace-list.component.html',
  styleUrl: './execution-trace-list.component.css'
})
export class ExecutionTraceListComponent extends BasePagedList<ExecutionSessionResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'aiAgent.executionTrace.title',
    stateKey: 'ai-agent.execution-traces',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'aiAgent.executionTrace.toast.loadTracesFailed',
    toolbar: {
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      { field: 'agentId', label: 'aiAgent.agentId', placeholder: 'aiAgent.executionTrace.filterAgentId' },
      { field: 'userId', label: 'aiAgent.userId', placeholder: 'aiAgent.executionTrace.filterUserId' },
      {
        field: 'status',
        label: 'status',
        type: 'select',
        options: [
          { label: 'RUNNING', value: 'RUNNING' },
          { label: 'COMPLETED', value: 'COMPLETED' },
          { label: 'FAILED', value: 'FAILED' },
          { label: 'MAX_STEP_EXCEEDED', value: 'MAX_STEP_EXCEEDED' }
        ]
      }
    ],
    filterOptions: { primaryField: 'agentId' },
    columns: [
      { field: 'sessionId', header: 'aiAgent.sessionId', type: 'copyable', sortable: true },
      { field: 'agentId', header: 'aiAgent.agentId', type: 'copyable' },
      { field: 'userId', header: 'aiAgent.userId', type: 'copyable' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        sortable: true,
        badgeMap: { RUNNING: 'info', COMPLETED: 'success', FAILED: 'danger', MAX_STEP_EXCEEDED: 'danger' }
      },
      { field: 'iterationCount', header: 'aiAgent.iterations', sortable: true },
      { field: 'totalTokens', header: 'aiAgent.tokens', sortable: true },
      { field: 'startedAt', header: 'aiAgent.startedAt', type: 'date', sortable: true, format: 'dd/MM/yyyy HH:mm:ss' },
      { field: 'finishedAt', header: 'aiAgent.finishedAt', type: 'date', format: 'dd/MM/yyyy HH:mm:ss' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '16rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'aiAgent.executionTrace.viewSteps', icon: 'pi pi-eye', severity: 'help', onClick: (row) => this.openSteps(row) },
          {
            label: 'aiAgent.playground.title',
            icon: 'pi pi-play',
            severity: 'info',
            disabled: (row) => !row.agentId,
            onClick: (row) => this.openPlayground(row)
          }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  stepLoading = false;
  stepError = '';
  stepPopupVisible = false;
  selectedSession: ExecutionSessionResponse | null = null;
  selectedSteps: ExecutionStepResponse[] = [];
  selectedStepTimelineItems: TimelineItem[] = [];
  selectedStepPayload: ExecutionStepTimelineData | null = null;

  constructor(
    private readonly service: ExecutionTraceService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['startedAt,desc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  get selectedSessionItems(): KeyValueItem[] {
    const session = this.selectedSession;
    if (!session) {
      return [];
    }

    return [
      { label: 'aiAgent.sessionId', value: session.sessionId, type: 'copyable' },
      { label: 'status', value: session.status, type: 'badge', variant: this.statusVariant(session.status) },
      { label: 'aiAgent.agent', value: session.agentId, type: 'copyable' },
      { label: 'aiAgent.user', value: session.userId || '-' },
      { label: 'aiAgent.channel', value: session.channel || '-' },
      { label: 'aiAgent.tokens', value: session.totalTokens ?? 0, type: 'number' },
      { label: 'aiAgent.iterations', value: session.iterationCount ?? 0, type: 'number' },
      { label: 'aiAgent.input', value: session.inputText || '-', emptyValue: '-' },
      { label: 'aiAgent.error', value: session.errorMessage || '-', emptyValue: '-' }
    ];
  }

  get selectedStepPayloadTitle(): string {
    const step = this.selectedStepPayload?.step;
    return step ? `#${step.stepNo} ${step.stepType}` : 'aiAgent.executionTrace.stepPayload';
  }

  onPopupVisibleChange(visible: boolean): void {
    this.stepPopupVisible = visible;
    if (!visible) {
      this.resetPopupState();
    }
  }

  closePopup(): void {
    this.stepPopupVisible = false;
    this.resetPopupState();
  }

  refreshSelectedSteps(): void {
    if (!this.selectedSession) {
      return;
    }

    this.stepLoading = true;
    this.stepError = '';
    this.selectedStepPayload = null;
    this.loadingService.track(this.service.getSteps(this.selectedSession.sessionId)).pipe(finalize(() => (this.stepLoading = false))).subscribe({
      next: (steps) => {
        this.selectedSteps = [...steps].sort((left, right) => left.stepNo - right.stepNo);
        this.selectedStepTimelineItems = this.selectedSteps.map((step) => this.toTimelineItem(step));
      },
      error: () => {
        this.stepError = 'aiAgent.executionTrace.toast.loadStepsFailed';
        this.toastService.error('aiAgent.executionTrace.toast.loadStepsFailed');
      }
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getSessionPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'aiAgent.executionTrace.toast.loadTracesFailed',
      onError: () => this.toastService.error('aiAgent.executionTrace.toast.loadTracesFailed')
    });
  }

  openStepPayload(item: TimelineItem): void {
    this.selectedStepPayload = (item.data as ExecutionStepTimelineData | undefined) ?? null;
  }

  private openSteps(session: ExecutionSessionResponse): void {
    this.selectedSession = session;
    this.selectedSteps = [];
    this.selectedStepTimelineItems = [];
    this.selectedStepPayload = null;
    this.stepError = '';
    this.stepPopupVisible = true;
    this.refreshSelectedSteps();
  }

  private openPlayground(session: ExecutionSessionResponse): void {
    void this.router.navigate(['/admin/ai-agent/runtime/playground'], {
      queryParams: {
        agentId: session.agentId,
        userId: session.userId || undefined
      }
    });
  }

  private resetPopupState(): void {
    this.selectedSession = null;
    this.selectedSteps = [];
    this.selectedStepTimelineItems = [];
    this.selectedStepPayload = null;
    this.stepLoading = false;
    this.stepError = '';
  }

  private toTimelineItem(step: ExecutionStepResponse): TimelineItem {
    const payload = this.formatPayload(step.payloadJson);
    const appearance = this.getStepAppearance(step.stepType);
    return {
      id: step.id,
      title: `#${step.stepNo} ${step.stepType}`,
      time: step.createdAt,
      icon: appearance.icon,
      variant: appearance.variant,
      actionLabel: 'shared.json.view',
      data: { step, payload } satisfies ExecutionStepTimelineData
    };
  }

  private getStepAppearance(stepType: ExecutionStepResponse['stepType']): { icon: string; variant: BadgeVariant } {
    switch (stepType) {
      case 'USER_INPUT':
        return { icon: 'pi pi-user', variant: 'success' };
      case 'MODEL_REQUEST':
        return { icon: 'pi pi-send', variant: 'info' };
      case 'MODEL_RESPONSE':
        return { icon: 'pi pi-sparkles', variant: 'default' };
      case 'TOOL_CALL':
        return { icon: 'pi pi-wrench', variant: 'warning' };
      case 'TOOL_RESULT':
        return { icon: 'pi pi-check-circle', variant: 'success' };
      case 'FINAL_ANSWER':
        return { icon: 'pi pi-verified', variant: 'info' };
      case 'ERROR':
        return { icon: 'pi pi-exclamation-triangle', variant: 'danger' };
      default:
        return { icon: 'pi pi-circle', variant: 'muted' };
    }
  }

  private statusVariant(status?: string): BadgeVariant {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'RUNNING':
        return 'info';
      case 'FAILED':
      case 'MAX_STEP_EXCEEDED':
        return 'danger';
      default:
        return 'muted';
    }
  }

  private formatPayload(payloadJson?: string): string {
    if (!payloadJson?.trim()) {
      return '{}';
    }

    try {
      return JSON.stringify(JSON.parse(payloadJson), null, 2);
    } catch {
      return payloadJson;
    }
  }
}
