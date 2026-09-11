import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import type { QuantRunsPageResponseDto } from '../../models/quant-backtest.dto';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';
import { RunsOverviewComponent } from './runs-overview.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

describe('RunsOverviewComponent', () => {
  let component: RunsOverviewComponent;
  let fixture: ComponentFixture<RunsOverviewComponent>;
  let apiServiceMock: Partial<QuantBacktestApiService>;
  let routerMock: Partial<Router>;

  const mockRunsResponse: QuantRunsPageResponseDto = {
    data: [
      {
        runId: 'job-run-001',
        jobConfigCode: 'cfg-001',
        name: 'BTC Momentum Test',
        strategyId: 'ict_liquidity_reversal',
        strategyConfigId: 'ict-default',
        datasetVersion: 'binance-usdm-1m-202601-v1',
        instrumentIds: ['BTCUSDT'],
        status: 'SUCCEEDED',
        jobStatus: 'SUCCESS',
        triggerType: 'MANUAL',
        startedAt: '2026-09-08T00:00:00Z',
        finishedAt: '2026-09-08T00:15:00Z',
        durationMs: 900000,
        quantOutcome: 'COMPLETED',
        quantStatus: 'STALE_INTERNAL_STATUS',
        backtestRunId: 'qbt-run-001',
        summaryMetrics: {
          totalReturn: 0.154,
          maxDrawdown: -3.5,
          winRate: 0.64,
          totalTrades: 42,
        },
      },
    ],
    metadata: {
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
    },
    overview: {
      runningCount: 0,
      completedCount: 1,
      winRate: 0.64,
      netReturn: 0.154,
    },
  };

  beforeEach(async () => {
    apiServiceMock = {
      getRuns: vi.fn().mockReturnValue(of(mockRunsResponse)),
    };

    routerMock = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true)),
    };

    await TestBed.configureTestingModule({
      declarations: [RunsOverviewComponent, TranslateContentPipeStub],
      providers: [
        { provide: QuantBacktestApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        QuantBacktestStateService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RunsOverviewComponent);
    component = fixture.componentInstance;
  });

  it('creates the component and initializes with compliant TableConfig', () => {
    expect(component).toBeTruthy();
    const config = component.tableConfig;
    expect(config.title).toBe('quantBacktest.runs.table.title');
    expect(config.emptyTitle).toBe('quantBacktest.runs.table.emptyTitle');
    expect(config.emptyDescription).toBe('quantBacktest.runs.table.emptyDescription');

    // fe-note check: no forbidden properties
    expect((config as any).selectable).toBeUndefined();
    expect((config as any).hoverable).toBeUndefined();
    expect((config as any).emptyMessage).toBeUndefined();

    // Check actions column has onClick
    const actionsCol = config.columns.find((c) => c.type === 'actions');
    expect(actionsCol).toBeDefined();
    expect(actionsCol?.actions?.[0]?.onClick).toBeTypeOf('function');
  });

  it('loads runs from BFF on init and maps summary metrics', () => {
    fixture.detectChanges();

    expect(apiServiceMock.getRuns).toHaveBeenCalled();
    expect(component.runs().length).toBe(1);
    expect(component.runs()[0]?.runId).toBe('job-run-001');
    expect(component.runs()[0]?.jobStatus).toBe('SUCCESS');
    expect(component.runs()[0]?.quantOutcome).toBe('COMPLETED');
    expect(component.runs()[0]?.quantStatus).toBe('STALE_INTERNAL_STATUS');
    expect(component.summary().completed).toBe(1);
    expect(component.summary().netReturn).toBe(0.154);
    expect(component.loading()).toBe(false);
  });

  it('handles server-side pagination changes and requests correct 0-based page for BFF', () => {
    fixture.detectChanges();

    component.onPageChange({ page: 1, rows: 20, first: 20 });
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(20);
    expect(apiServiceMock.getRuns).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 20 }),
    );
  });

  it('handles filter application and reset', () => {
    fixture.detectChanges();

    component.onFilterApply({ keyword: 'ETH', status: 'RUNNING' });
    expect(component.page()).toBe(1);
    expect(apiServiceMock.getRuns).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'ETH', status: 'RUNNING', page: 0 }),
    );

    component.onFilterReset();
    expect(component.filterValues()).toEqual({});
    expect(apiServiceMock.getRuns).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  it('handles dateRange filter application and converts to ISO query params', () => {
    fixture.detectChanges();

    const fromDate = new Date('2026-01-01T00:00:00.000Z');
    const toDate = new Date('2026-01-31T23:59:00.000Z');

    component.onFilterApply({
      dateRange: { from: fromDate, to: toDate },
    });

    expect(apiServiceMock.getRuns).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T23:59:00.000Z',
      }),
    );
  });

  it('handles direct dateFrom and dateTo ISO string filters', () => {
    fixture.detectChanges();

    component.onFilterApply({
      dateFrom: '2026-02-01T00:00:00.000Z',
      dateTo: '2026-02-28T23:59:00.000Z',
    });

    expect(apiServiceMock.getRuns).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: '2026-02-01T00:00:00.000Z',
        dateTo: '2026-02-28T23:59:00.000Z',
      }),
    );
  });

  it('surfaces backend errors without rendering fake fallback rows', () => {
    apiServiceMock.getRuns = vi.fn().mockReturnValue(
      throwError(() => ({
        error: {
          code: 'QUANT_SERVICE_UNAVAILABLE',
          message: 'Quant engine unreachable',
        },
      })),
    );

    component.loadRuns();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Quant engine unreachable');
    expect(component.errorCode()).toBe('QUANT_SERVICE_UNAVAILABLE');
    expect(component.runs().length).toBe(0); // Strictly no fallback data
  });

  it('navigates to create page on toolbar create action', () => {
    component.onToolbarAction({ id: 'create', label: 'New' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['create'], expect.anything());
  });

  it('navigates to run detail on row click or view action', () => {
    fixture.detectChanges();
    const row = component.runs()[0]!;
    component.onRowClick(row);
    expect(routerMock.navigate).toHaveBeenCalledWith(['job-run-001'], expect.anything());

    component.onActionClick({
      action: { id: 'view', label: 'View', onClick: vi.fn() },
      row,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['job-run-001'], expect.anything());
  });
});
