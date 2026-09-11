import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import type { QuantStrategyDto } from '../../models/quant-backtest.dto';
import { QuantBacktestStateService } from '../../services/quant-backtest-state.service';
import { StrategiesComponent } from './strategies.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

describe('StrategiesComponent', () => {
  let component: StrategiesComponent;
  let fixture: ComponentFixture<StrategiesComponent>;
  let apiServiceMock: Partial<QuantBacktestApiService>;
  let routerMock: Partial<Router>;
  let toastMock: Partial<ToastService>;

  const mockStrategy: QuantStrategyDto = {
    id: 'ict_liquidity_reversal',
    name: 'ICT Liquidity Reversal',
    description: 'ICT Strategy',
    schema: {
      type: 'object',
      properties: {
        swingLeftBars: { type: 'integer', default: 3 },
      },
    },
    fields: [],
    parameterFields: [],
    simulationFields: [],
    configs: [
      {
        configId: 'cfg-default',
        strategyId: 'ict_liquidity_reversal',
        name: 'Default 1m',
        parameters: { swingLeftBars: 3 },
        dataRequirements: { base_timeframe: '1m' },
        simulation: { intrabar_policy: 'CONSERVATIVE_STOP_FIRST' },
      },
    ],
  };

  beforeEach(async () => {
    apiServiceMock = {
      getStrategies: vi.fn().mockReturnValue(of([mockStrategy])),
      validateStrategyParameters: vi.fn().mockReturnValue(of({ valid: true, errors: [] })),
    };

    routerMock = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true)),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [StrategiesComponent, TranslateContentPipeStub],
      providers: [
        { provide: QuantBacktestApiService, useValue: apiServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        { provide: ToastService, useValue: toastMock },
        QuantBacktestStateService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StrategiesComponent);
    component = fixture.componentInstance;
  });

  it('loads strategies on init and displays in table without CRUD options', () => {
    fixture.detectChanges();

    expect(apiServiceMock.getStrategies).toHaveBeenCalled();
    expect(component.strategies().length).toBe(1);
    expect(component.strategies()[0]?.id).toBe('ict_liquidity_reversal');

    // fe-note check: verify TableConfig has no forbidden CRUD mutations
    const config = component.tableConfig;
    expect(config.toolbar?.new).toBeUndefined();
    expect(config.toolbar?.delete).toBeUndefined();
  });

  it('opens and closes drawer with strategy metadata and parameters schema', () => {
    fixture.detectChanges();

    const strat = component.strategies()[0]!;
    component.openDrawer(strat);

    expect(component.drawerOpen()).toBe(true);
    expect(component.selectedStrategy()?.id).toBe('ict_liquidity_reversal');
    expect(component.testParameters()['swingLeftBars']).toBe(3);

    component.closeDrawer();
    expect(component.drawerOpen()).toBe(false);
    expect(component.selectedStrategy()).toBeNull();
  });

  it('loads preset parameters into tester', () => {
    fixture.detectChanges();

    const strat = component.strategies()[0]!;
    component.openDrawer(strat);
    component.loadPresetIntoTester({
      ...mockStrategy.configs[0]!,
      parameters: { swingLeftBars: 5 },
    });

    expect(component.testParameters()['swingLeftBars']).toBe(5);
  });

  it('validates test parameters against server and surfaces validation errors', () => {
    fixture.detectChanges();

    const strat = component.strategies()[0]!;
    component.openDrawer(strat);

    // Successful validation
    component.validateTesterParameters();
    expect(apiServiceMock.validateStrategyParameters).toHaveBeenCalledWith({
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'cfg-default',
      parameters: { swingLeftBars: 3 },
    });
    expect(component.validationResult()?.valid).toBe(true);
    expect(toastMock.success).toHaveBeenCalledWith('quantBacktest.create.validationSuccess');

    // Failure validation
    apiServiceMock.validateStrategyParameters = vi.fn().mockReturnValue(
      of({
        valid: false,
        errors: [{ field: 'swingLeftBars', message: 'Value too small' }],
      }),
    );

    component.validateTesterParameters();
    expect(component.validationResult()?.valid).toBe(false);
    expect(component.validationResult()?.errors[0]?.message).toBe('Value too small');
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('uses shared TableConfig for strategy schema details', () => {
    expect(component.schemaTableConfig.rowKey).toBe('key');
    expect(component.schemaTableConfig.pagination).toBe(false);
    expect(component.schemaTableConfig.columns.map((column) => column.field)).toEqual([
      'key',
      'type',
      'defaultValue',
      'description',
    ]);
  });

  it('navigates to create backtest wizard with selected strategy ID', () => {
    fixture.detectChanges();

    const strat = component.strategies()[0]!;
    component.openDrawer(strat);
    component.launchBacktestWithStrategy();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/quant-backtest/runs/create'], {
      queryParams: { strategyId: 'ict_liquidity_reversal' },
    });
  });

  it('surfaces backend errors when loading strategies fails', () => {
    apiServiceMock.getStrategies = vi.fn().mockReturnValue(
      throwError(() => ({
        error: {
          code: 'REGISTRY_ERROR',
          message: 'Cannot load strategies from BFF',
        },
      })),
    );

    component.loadStrategies();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Cannot load strategies from BFF');
    expect(component.strategies().length).toBe(0);
  });
});
