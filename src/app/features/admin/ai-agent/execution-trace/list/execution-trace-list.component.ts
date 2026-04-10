import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { ExecutionSessionResponse, ExecutionStepResponse } from '../../../../../core/models/ai-agent/execution-trace.model';
import { ExecutionTraceService } from '../../../../../core/services/ai-agent-service/execution-trace.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-execution-trace-list',
  standalone: false,
  templateUrl: './execution-trace-list.component.html',
  styleUrl: './execution-trace-list.component.css'
})
export class ExecutionTraceListComponent extends BasePagedList<ExecutionSessionResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Execution Traces',
    filters: [
      { field: 'agentId', label: 'Agent ID', placeholder: 'Filter by agent id' },
      { field: 'userId', label: 'User ID', placeholder: 'Filter by user id' },
      {
        field: 'status',
        label: 'Status',
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
      { field: 'sessionId', header: 'Session ID', sortable: true },
      { field: 'agentId', header: 'Agent ID' },
      { field: 'userId', header: 'User ID' },
      { field: 'status', header: 'Status', sortable: true },
      { field: 'iterationCount', header: 'Iterations', sortable: true },
      { field: 'totalTokens', header: 'Tokens', sortable: true },
      { field: 'startedAt', header: 'Started At' },
      { field: 'finishedAt', header: 'Finished At' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'View Steps', icon: 'pi pi-eye', severity: 'help', onClick: (row) => this.openSteps(row) },
          {
            label: 'Playground',
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

  loading = false;
  stepLoading = false;
  stepPopupVisible = false;
  selectedSession: ExecutionSessionResponse | null = null;
  selectedSteps: ExecutionStepResponse[] = [];

  constructor(
    private readonly service: ExecutionTraceService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
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
    this.loadingService.track(this.service.getSteps(this.selectedSession.sessionId)).pipe(finalize(() => (this.stepLoading = false))).subscribe({
      next: (steps) => {
        this.selectedSteps = steps;
      },
      error: () => this.toastService.error('Load execution steps failed')
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService.track(this.service.getSessionPage(this.page, this.pageSize, ['startedAt,desc'], this.filters)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (res: BasePageResponse<ExecutionSessionResponse>) => this.setPageResponse(res),
      error: () => this.toastService.error('Load execution traces failed')
    });
  }

  private openSteps(session: ExecutionSessionResponse): void {
    this.selectedSession = session;
    this.selectedSteps = [];
    this.stepPopupVisible = true;
    this.refreshSelectedSteps();
  }

  private openPlayground(session: ExecutionSessionResponse): void {
    void this.router.navigate(['/admin/ai-agent/playground'], {
      queryParams: {
        agentId: session.agentId,
        userId: session.userId || undefined
      }
    });
  }

  private resetPopupState(): void {
    this.selectedSession = null;
    this.selectedSteps = [];
    this.stepLoading = false;
  }
}
