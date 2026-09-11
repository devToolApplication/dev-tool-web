import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import type {
  BacktestCreateResponseDto,
  QuantDatasetDto,
  QuantStrategyDto,
} from '../../models/quant-backtest.dto';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';
import { RunCreateComponent } from './run-create.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

const strategy: QuantStrategyDto = {
  id: 'ict_liquidity_reversal',
  name: 'ICT Liquidity Reversal',
  description: 'ICT strategy',
  schema: {
    type: 'object',
    properties: {
      swingLeftBars: { type: 'integer', minimum: 1, default: 3 },
    },
    required: ['swingLeftBars'],
  },
  fields: [],
  parameterFields: [],
  simulationFields: [
    {
      name: 'initial_capital',
      label: 'Initial Capital',
      type: 'number',
      default: 100000,
      required: true,
      min_value: 1,
    },
    {
      name: 'intrabar_policy',
      label: 'Intrabar Policy',
      type: 'select',
      default: 'CONSERVATIVE_STOP_FIRST',
      options: ['CONSERVATIVE_STOP_FIRST'],
    },
    {
      name: 'fee_model',
      label: 'Fee Model',
      type: 'select',
      default: 'BINANCE_USDM_V1',
      options: ['BINANCE_USDM_V1'],
    },
    {
      name: 'slippage_model',
      label: 'Slippage Model',
      type: 'select',
      default: 'FIXED_BPS',
      options: ['FIXED_BPS'],
    },
    {
      name: 'slippage_bps',
      label: 'Slippage Basis Points',
      type: 'number',
      default: 1,
      min_value: 0,
      max_value: 100,
    },
  ],
  configs: [
    {
      configId: 'ict-default',
      strategyId: 'ict_liquidity_reversal',
      name: 'Default',
      parameters: { swingLeftBars: 3 },
      dataRequirements: { base_timeframe: '1m' },
      simulation: {
        intrabar_policy: 'CONSERVATIVE_STOP_FIRST',
        fee_model: 'BINANCE_USDM_V1',
        slippage_model: 'FIXED_BPS',
      },
    },
  ],
};

const alternateStrategy: QuantStrategyDto = {
  ...strategy,
  id: 'alternate',
  name: 'Alternate',
  configs: [
    {
      ...strategy.configs[0]!,
      configId: 'alternate-default',
      strategyId: 'alternate',
      name: 'Alternate default',
      parameters: { swingLeftBars: 5 },
    },
  ],
};

const dataset: QuantDatasetDto = {
  datasetVersion: 'dataset-1',
  provider: 'BINANCE',
  venue: 'BINANCE_USDM',
  assetClass: 'CRYPTO_FUTURES',
  instrumentIds: ['BTCUSDT-PERP'],
  timeframe: '1m',
  start: '2026-01-01T00:00:00.000Z',
  end: '2026-01-31T23:59:00.000Z',
  barCount: 44640,
  timezone: 'UTC',
  status: 'READY',
  createdAt: '2026-02-01T00:00:00.000Z',
};

describe('RunCreateComponent', () => {
  let component: RunCreateComponent;
  let fixture: ComponentFixture<RunCreateComponent>;
  let apiService: {
    getStrategies: ReturnType<typeof vi.fn>;
    getReadyDatasets: ReturnType<typeof vi.fn>;
    validateStrategyParameters: ReturnType<typeof vi.fn>;
    createRun: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiService = {
      getStrategies: vi.fn().mockReturnValue(of([strategy, alternateStrategy])),
      getReadyDatasets: vi.fn().mockReturnValue(
        of({
          items: [dataset],
          nextCursor: null,
          hasMore: false,
        }),
      ),
      validateStrategyParameters: vi.fn().mockReturnValue(of({ valid: true, errors: [] })),
      createRun: vi.fn().mockReturnValue(
        of({
          executionMode: 'RUN_NOW',
          jobConfigCode: 'quant-backtest-run-1',
          jobRunId: 'job-run-1',
          status: 'STARTED',
        } satisfies BacktestCreateResponseDto),
      ),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [RunCreateComponent, TranslateContentPipeStub],
      providers: [
        { provide: QuantBacktestApiService, useValue: apiService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: ToastService, useValue: toast },
        QuantBacktestStateService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RunCreateComponent);
    component = fixture.componentInstance;
  });

  it('loads all pages of READY datasets using cursor pagination without losing prior items', () => {
    const dataset2: QuantDatasetDto = {
      ...dataset,
      datasetVersion: 'dataset-2',
      instrumentIds: ['ETHUSDT-PERP'],
    };

    apiService.getReadyDatasets = vi
      .fn()
      .mockReturnValueOnce(
        of({
          items: [dataset],
          nextCursor: 'cursor-page-2',
          hasMore: true,
        }),
      )
      .mockReturnValueOnce(
        of({
          items: [dataset2],
          nextCursor: null,
          hasMore: false,
        }),
      );

    component.loadInitialData();

    expect(apiService.getReadyDatasets).toHaveBeenCalledTimes(2);
    expect(apiService.getReadyDatasets).toHaveBeenNthCalledWith(1, undefined);
    expect(apiService.getReadyDatasets).toHaveBeenNthCalledWith(2, 'cursor-page-2');
    expect(component.readyDatasets()).toHaveLength(2);
    expect(component.readyDatasets()[0]?.datasetVersion).toBe('dataset-1');
    expect(component.readyDatasets()[1]?.datasetVersion).toBe('dataset-2');
  });

  it('retries loading initial strategies and datasets when initialization fails', () => {
    apiService.getStrategies = vi
      .fn()
      .mockReturnValueOnce(
        throwError(() => ({
          error: { code: 'INIT_ERROR', message: 'Initialization failed' },
        })),
      )
      .mockReturnValueOnce(of([strategy, alternateStrategy]));

    component.loadInitialData();
    expect(component.initFailed()).toBe(true);
    expect(component.serverError()).toBe('Initialization failed');

    component.onAlertAction();
    expect(apiService.getStrategies).toHaveBeenCalledTimes(2);
    expect(component.strategies()).toHaveLength(2);
  });

  it('navigates to Job Service jobs on openJobServiceJobs', () => {
    component.openJobServiceJobs();
    expect(router.navigate).toHaveBeenCalledWith(['/job-service/jobs']);
  });

  it('allows exactly one instrument to be selected in v1', () => {
    fixture.detectChanges();
    component.selectInstrument('BTCUSDT-PERP');
    expect(component.form().instrumentIds).toEqual(['BTCUSDT-PERP']);

    // Toggling another instrument replaces it, maintaining exactly 1
    component.toggleInstrument('ETHUSDT-PERP');
    expect(component.form().instrumentIds).toEqual(['ETHUSDT-PERP']);
  });

  it('tracks strategy and dataset loading independently', () => {
    const strategies = new Subject<QuantStrategyDto[]>();
    const datasets = new Subject<{
      items: QuantDatasetDto[];
      nextCursor: string | null;
      hasMore: boolean;
    }>();
    apiService.getStrategies.mockReturnValue(strategies);
    apiService.getReadyDatasets.mockReturnValue(datasets);

    fixture.detectChanges();
    expect(component.strategiesLoading()).toBe(true);
    expect(component.datasetsLoading()).toBe(true);
    expect(component.loadingInit()).toBe(true);

    strategies.next([strategy]);
    strategies.complete();
    expect(component.strategiesLoading()).toBe(false);
    expect(component.datasetsLoading()).toBe(true);
    expect(component.loadingInit()).toBe(true);

    datasets.next({
      items: [dataset],
      nextCursor: null,
      hasMore: false,
    });
    datasets.complete();
    expect(component.datasetsLoading()).toBe(false);
    expect(component.loadingInit()).toBe(false);
  });

  it('binds strategy selection separately from configuration selection', () => {
    fixture.detectChanges();
    component.onStrategyChange('alternate');
    expect(component.form().strategyId).toBe('alternate');
    expect(component.form().strategyConfigId).toBe('alternate-default');
    expect(component.form().parameters['swingLeftBars']).toBe(5);

    component.onPresetChange('ict-default');
    expect(component.form().strategyId).toBe('alternate');
    expect(component.form().strategyConfigId).toBe('alternate-default');
  });

  it('applies strategy simulation metadata and READY dataset membership', () => {
    fixture.detectChanges();
    expect(component.form().intrabarPolicy).toBe('CONSERVATIVE_STOP_FIRST');
    expect(component.form().feeModel).toBe('BINANCE_USDM_V1');
    expect(component.form().slippageModel).toBe('FIXED_BPS');
    expect(component.form().datasetVersion).toBe('dataset-1');
    expect(component.form().instrumentIds).toEqual(['BTCUSDT-PERP']);
    expect(component.validateStep(2)).toBe(true);
    expect(component.validateStep(3)).toBe(true);
  });

  it('maps server validation errors and sends the selected config ownership', () => {
    fixture.detectChanges();
    apiService.validateStrategyParameters.mockReturnValue(
      of({
        valid: false,
        errors: [{ field: 'swingLeftBars', message: 'Must be >= 1' }],
      }),
    );

    component.validateParametersOnServer();
    expect(apiService.validateStrategyParameters).toHaveBeenCalledWith({
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'ict-default',
      parameters: { swingLeftBars: 3 },
    });
    expect(component.fieldErrors()['swingLeftBars']).toBe('Must be >= 1');
  });

  it('reuses one Idempotency-Key after a failed submission retry', () => {
    fixture.detectChanges();
    component.updateFormField('name', 'BTC retry test');
    apiService.createRun
      .mockReturnValueOnce(
        throwError(() => ({
          error: {
            traceId: 'trace-1',
            path: '/v1/quant-backtest/runs',
            status: 503,
            errorMessage: 'Provider unavailable',
            data: {
              code: 'PROVIDER_UNAVAILABLE',
              message: 'Provider unavailable',
              fieldErrors: [],
            },
          },
        })),
      )
      .mockReturnValueOnce(
        of({
          executionMode: 'RUN_NOW',
          jobConfigCode: 'quant-backtest-run-1',
          jobRunId: 'job-run-1',
          status: 'STARTED',
          replayed: true,
        }),
      );

    component.submitBacktest();
    component.retrySubmit();

    expect(apiService.createRun).toHaveBeenCalledTimes(2);
    const firstKey = apiService.createRun.mock.calls[0]?.[1] as string;
    const retryKey = apiService.createRun.mock.calls[1]?.[1] as string;
    expect(firstKey).toMatch(/^qbt-ui-/);
    expect(retryKey).toBe(firstKey);
    expect(router.navigate).toHaveBeenCalledWith(['/quant-backtest/runs', 'job-run-1']);
  });

  it('blocks duplicate clicks while the submission remains in flight', () => {
    fixture.detectChanges();
    component.updateFormField('name', 'BTC duplicate test');
    apiService.createRun.mockReturnValue(new Observable(() => undefined));

    component.submitBacktest();
    component.submitBacktest();

    expect(apiService.createRun).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith('quantBacktest.error.duplicateSubmit');
  });

  it('uses accessible native radio semantics on instrument selection and supports arrow-key navigation', () => {
    const multiInstrumentDataset: QuantDatasetDto = {
      ...dataset,
      datasetVersion: 'multi-dataset-1',
      instrumentIds: ['BTCUSDT-PERP', 'ETHUSDT-PERP', 'SOLUSDT-PERP'],
    };
    apiService.getReadyDatasets.mockReturnValue(
      of({
        items: [multiInstrumentDataset],
        nextCursor: null,
        hasMore: false,
      }),
    );

    component.loadInitialData();
    component.updateFormField('name', 'Test Run');
    fixture.detectChanges();
    component.goToStep(2);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const radiogroup = compiled.querySelector('[role="radiogroup"]');
    expect(radiogroup).toBeTruthy();

    const radioInputs = compiled.querySelectorAll<HTMLInputElement>(
      'input[type="radio"][name="instrumentChoice"]',
    );
    expect(radioInputs.length).toBe(3);

    // Initial state: first instrument selected
    expect(component.form().instrumentIds).toEqual(['BTCUSDT-PERP']);
    expect(radioInputs[0].checked).toBe(true);
    expect(radioInputs[1].checked).toBe(false);

    // ArrowRight keydown navigates to next instrument (ETHUSDT-PERP)
    const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    component.onInstrumentKeydown(arrowRightEvent, 0);
    expect(component.form().instrumentIds).toEqual(['ETHUSDT-PERP']);

    // ArrowDown keydown navigates to next instrument (SOLUSDT-PERP)
    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    component.onInstrumentKeydown(arrowDownEvent, 1);
    expect(component.form().instrumentIds).toEqual(['SOLUSDT-PERP']);

    // ArrowDown wraps around to first instrument (BTCUSDT-PERP)
    component.onInstrumentKeydown(arrowDownEvent, 2);
    expect(component.form().instrumentIds).toEqual(['BTCUSDT-PERP']);

    // ArrowLeft wraps around to last instrument (SOLUSDT-PERP)
    const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
    component.onInstrumentKeydown(arrowLeftEvent, 0);
    expect(component.form().instrumentIds).toEqual(['SOLUSDT-PERP']);

    // ArrowUp navigates to previous instrument (ETHUSDT-PERP)
    const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    component.onInstrumentKeydown(arrowUpEvent, 2);
    expect(component.form().instrumentIds).toEqual(['ETHUSDT-PERP']);

    // Preserves exactly-one selection
    expect(component.form().instrumentIds).toHaveLength(1);
  });

  it('localizes execution mode and simulation option keys in review step without exposing raw enum keys', () => {
    fixture.detectChanges();

    expect(component.getExecutionModeI18nKey('RUN_NOW')).toBe(
      'quantBacktest.create.field.modeRunNow',
    );
    expect(component.getExecutionModeI18nKey('SCHEDULE')).toBe(
      'quantBacktest.create.field.modeSchedule',
    );

    expect(component.getSimulationOptionI18nKey('CONSERVATIVE_STOP_FIRST')).toBe(
      'quantBacktest.simulation.CONSERVATIVE_STOP_FIRST',
    );
    expect(component.getSimulationOptionI18nKey('BINANCE_USDM_V1')).toBe(
      'quantBacktest.simulation.BINANCE_USDM_V1',
    );
    expect(component.getSimulationOptionI18nKey('BINANCE_SPOT_VIP0')).toBe(
      'quantBacktest.simulation.BINANCE_SPOT_VIP0',
    );
    expect(component.getSimulationOptionI18nKey('FIXED_BPS')).toBe(
      'quantBacktest.simulation.FIXED_BPS',
    );
    expect(component.getSimulationOptionI18nKey('ZERO')).toBe('quantBacktest.simulation.ZERO');
    expect(component.getSimulationOptionI18nKey('')).toBe('quantBacktest.common.notAvailable');
  });
});
