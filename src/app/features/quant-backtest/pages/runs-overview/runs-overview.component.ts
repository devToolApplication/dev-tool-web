import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction } from '@shared/ui/patterns/table';
import type { TablePageChangeEvent } from '@shared/ui/patterns/table/component/table/table';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import {
  JOB_STATUS_I18N_MAP,
  QUANT_OUTCOME_I18N_MAP,
  buildRunsFilterFields,
  buildRunsTableConfig,
} from '../../models/quant-backtest.config';
import type {
  BacktestRunsQueryParamsDto,
  JobRunStatus,
  QuantOutcome,
  TriggerType,
} from '../../models/quant-backtest.dto';
import type { RunOverviewRecord, RunsSummaryMetrics } from '../../models/quant-backtest.model';
import { extractQuantBffError, mapRunItemDtoToRecord } from '../../services/quant-backtest.mapper';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';

@Component({
  selector: 'app-runs-overview',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './runs-overview.component.html',
  styleUrl: './runs-overview.component.css',
})
export class RunsOverviewComponent implements OnInit {
  private readonly apiService = inject(QuantBacktestApiService);
  private readonly stateService = inject(QuantBacktestStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);
  readonly runs = signal<RunOverviewRecord[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly summary = signal<RunsSummaryMetrics>({
    running: 0,
    completed: 0,
    winRate: 0,
    netReturn: 0,
  });

  readonly filterFields = buildRunsFilterFields();
  readonly filterValues = signal<Record<string, unknown>>({});

  readonly breadcrumb = [
    { label: 'quantBacktest.breadcrumb.root' },
    { label: 'quantBacktest.breadcrumb.runs' },
  ];

  readonly pageActions: ActionToolbarAction[] = [
    {
      id: 'create',
      label: 'quantBacktest.runs.action.new',
      icon: 'pi pi-plus',
      variant: 'primary',
    },
  ];

  readonly tableConfig = buildRunsTableConfig({
    onView: (row) => this.navigateToDetail(row.runId),
  });

  ngOnInit(): void {
    this.filterValues.set(this.stateService.runsFilters());
    this.page.set(this.stateService.runsPage());
    this.pageSize.set(this.stateService.runsPageSize());
    this.loadRuns();
  }

  loadRuns(): void {
    this.loading.set(true);
    this.error.set(null);
    this.errorCode.set(null);

    const f = this.filterValues();
    const dateRange = f['dateRange'] as { from?: unknown; to?: unknown } | undefined;
    const dateFrom = toIsoDateString(f['dateFrom'] ?? dateRange?.from);
    const dateTo = toIsoDateString(f['dateTo'] ?? dateRange?.to);

    const query: BacktestRunsQueryParamsDto = {
      page: this.page() - 1, // 0-based for BFF
      size: this.pageSize(),
      keyword: typeof f['keyword'] === 'string' ? f['keyword'] : undefined,
      status: typeof f['status'] === 'string' ? (f['status'] as JobRunStatus) : undefined,
      strategyId: typeof f['strategyId'] === 'string' ? f['strategyId'] : undefined,
      instrument: typeof f['instrument'] === 'string' ? f['instrument'] : undefined,
      dateFrom,
      dateTo,
      triggerType:
        typeof f['triggerType'] === 'string' ? (f['triggerType'] as TriggerType) : undefined,
    };

    this.apiService.getRuns(query).subscribe({
      next: (res) => {
        const records = (res.data ?? []).map((item) => mapRunItemDtoToRecord(item));
        this.runs.set(records);
        this.total.set(res.metadata?.totalElements ?? records.length);
        if (res.overview) {
          this.summary.set({
            running: res.overview.runningCount ?? 0,
            completed: res.overview.completedCount ?? 0,
            winRate: res.overview.winRate ?? 0,
            netReturn: res.overview.netReturn ?? 0,
          });
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const parsed = extractQuantBffError(err);
        this.error.set(parsed.message);
        this.errorCode.set(parsed.code);
        this.runs.set([]);
        this.loading.set(false);
      },
    });
  }

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'create') {
      void this.router.navigate(['create'], { relativeTo: this.route });
    }
  }

  onFilterApply(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.page.set(1);
    this.stateService.setFilters(values);
    this.loadRuns();
  }

  onFilterReset(): void {
    this.filterValues.set({});
    this.page.set(1);
    this.stateService.resetFilters();
    this.loadRuns();
  }

  onPageChange(event: TablePageChangeEvent): void {
    const newPage = event.page + 1; // 0-based to 1-based
    this.page.set(newPage);
    this.pageSize.set(event.rows);
    this.stateService.setPage(newPage, event.rows);
    this.loadRuns();
  }

  onRowClick(row: RunOverviewRecord): void {
    this.navigateToDetail(row.runId);
  }

  onActionClick(event: { action: TableAction<RunOverviewRecord>; row: RunOverviewRecord }): void {
    if (event.action.id === 'view') {
      this.navigateToDetail(event.row.runId);
    }
  }

  private navigateToDetail(runId: string): void {
    void this.router.navigate([runId], { relativeTo: this.route });
  }

  getJobStatusI18nKey(status: JobRunStatus): string {
    return JOB_STATUS_I18N_MAP[status] ?? 'quantBacktest.common.notAvailable';
  }

  getQuantOutcomeI18nKey(outcome: string | null | undefined): string {
    if (!outcome) return 'quantBacktest.common.notAvailable';
    return QUANT_OUTCOME_I18N_MAP[outcome as QuantOutcome] ?? 'quantBacktest.common.notAvailable';
  }
}

function toIsoDateString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
  }
  return undefined;
}
