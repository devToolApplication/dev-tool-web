import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

import {
  ExecutorVersionResponse,
  RuleConfigResponse,
  StrategyConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormConfig } from '../../../../../../shared/ui/form-input/models/form-config.model';

import { StrategyConfigFormComponent } from './strategy-config-form.component';

describe('StrategyConfigFormComponent', () => {
  let component: StrategyConfigFormComponent;
  let fixture: ComponentFixture<StrategyConfigFormComponent>;
  let strategyTemplate: FormConfig;
  let serviceMock: Pick<
    TradingSystemService,
    'getStrategyExecutors' | 'getRuleConfigs' | 'getStrategyConfig' | 'saveStrategyConfig'
  >;

  beforeEach(async () => {
    strategyTemplate = {
      fields: [
        {
          name: 'config',
          type: 'group',
          label: 'tradeBot.template.strategySettings',
          children: [
            {
              name: 'side',
              type: 'select',
              label: 'tradeBot.field.side',
              options: [
                { label: 'tradeBot.side.buy', value: 'BUY' },
                { label: 'tradeBot.side.sell', value: 'SELL' }
              ]
            },
            { name: 'allowMultiplePositions', type: 'checkbox', label: 'tradeBot.field.allowMultiplePositions' },
            { name: 'maxOpenPositions', type: 'number', label: 'tradeBot.field.maxOpenPositions' },
            { name: 'note', type: 'textarea', label: 'tradeBot.field.note' }
          ]
        }
      ]
    };
    const executors: ExecutorVersionResponse[] = [
      { executor: 'ENTRY_TP_SL', latestVersion: 'v1', versions: ['v1'], formTemplate: strategyTemplate }
    ];
    const rule: RuleConfigResponse = {
      id: 'rule-1',
      code: 'TEST_ENTRY',
      executor: 'TREND',
      executorVersion: 'v1',
      config: {},
      indicators: [],
      childRules: [],
      overlay: {},
      status: 'ACTIVE'
    };
    const detail: StrategyConfigResponse = {
      id: 'strategy-1',
      code: 'TEST_STRATEGY',
      type: 'ENTRY_TP_SL',
      strategyVersion: 'v1',
      entryRule: 'TEST_ENTRY',
      slRule: 'TEST_ENTRY',
      tpRule: 'TEST_ENTRY',
      status: 'ACTIVE',
      config: {
        side: 'SELL',
        allowMultiplePositions: true,
        maxOpenPositions: 3,
        note: 'test note'
      }
    };

    serviceMock = {
      getStrategyExecutors: vi.fn(() => of(executors)),
      getRuleConfigs: vi.fn(() => of([rule])),
      getStrategyConfig: vi.fn(() => of(detail)),
      saveStrategyConfig: vi.fn(() => of(detail))
    };

    await TestBed.configureTestingModule({
      declarations: [StrategyConfigFormComponent],
      providers: [
        { provide: TradingSystemService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'strategy-1' }) } }
        },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: LoadingService, useValue: { track: <T>(source$: Observable<T>) => source$ } },
        { provide: ToastService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: I18nService, useValue: { t: (key: unknown) => String(key ?? '') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StrategyConfigFormComponent);
    component = fixture.componentInstance;
  });

  it('loads strategy executor template and renders config fields without raw JSON', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(serviceMock.getStrategyExecutors).toHaveBeenCalled();
    expect(serviceMock.getRuleConfigs).toHaveBeenCalled();
    expect(serviceMock.getStrategyConfig).toHaveBeenCalledWith('strategy-1');
    expect(component.formInitialValue['config']).toEqual({
      side: 'SELL',
      allowMultiplePositions: true,
      maxOpenPositions: 3,
      note: 'test note'
    });
    expect(component.formInitialValue['strategySide']).toBeUndefined();

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).toContain('basicInfo');
    expect(fieldNames).toContain('ruleMapping');
    expect(fieldNames).toContain('config');
    expect(fieldNames).not.toContain('strategySettings');
    expect(fieldNames).not.toContain('advancedJson');
    expect(fieldNames).not.toContain('configText');
    expect(component.pageConfig.infoSection).toBeNull();

    const configField = component.formConfig.fields.find((field) => field.name === 'config');
    expect(configField?.type).toBe('group');
    if (configField?.type === 'group') {
      expect(configField.children.map((field) => field.name)).toEqual([
        'side',
        'allowMultiplePositions',
        'maxOpenPositions',
        'note'
      ]);
    }
  });

  it('maps backend template config back to strategy payload', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const payload = (component as any).toPayload({
      code: 'TEST_STRATEGY',
      type: 'ENTRY_TP_SL',
      strategyVersion: 'v1',
      entryRule: 'TEST_ENTRY',
      slRule: 'TEST_SL',
      tpRule: 'TEST_TP',
      status: 'ACTIVE',
      config: {
        side: 'BUY',
        allowMultiplePositions: false,
        maxOpenPositions: 2,
        note: 'mapped from template'
      }
    });

    expect(payload.config).toEqual({
      side: 'BUY',
      allowMultiplePositions: false,
      maxOpenPositions: 2,
      note: 'mapped from template'
    });
    expect(payload.formTemplate).toEqual(strategyTemplate);
  });

  it('keeps Advanced JSON only as fallback when strategy template is missing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).applyTemplateState(
      {
        code: 'TEST_STRATEGY',
        type: 'ENTRY_TP_SL',
        strategyVersion: 'v1',
        entryRule: 'TEST_ENTRY',
        slRule: 'TEST_SL',
        tpRule: 'TEST_TP',
        status: 'ACTIVE',
        config: { legacyFlag: true }
      },
      undefined,
      'ENTRY_TP_SL'
    );

    expect(component.pageConfig.infoSection?.title).toBe('tradeBot.message.missingFormTemplateTitle');
    expect(component.pageConfig.infoSection?.description).toBe('tradeBot.message.missingStrategyFormTemplateDescription');
    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).not.toContain('config');
    expect(fieldNames).toContain('advancedJson');

    const advancedJson = component.formConfig.fields.find((field) => field.name === 'advancedJson');
    expect(advancedJson?.type).toBe('group');
    if (advancedJson?.type === 'group') {
      expect(advancedJson.collapsed).toBe(true);
      expect(advancedJson.children.map((field) => field.name)).toEqual(['configText']);
    }

    const payload = (component as any).toPayload({
      code: 'TEST_STRATEGY',
      type: 'ENTRY_TP_SL',
      strategyVersion: 'v1',
      entryRule: 'TEST_ENTRY',
      slRule: 'TEST_SL',
      tpRule: 'TEST_TP',
      status: 'ACTIVE',
      configText: '{"legacyFlag":true}'
    });

    expect(payload.config).toEqual({ legacyFlag: true });
    expect(payload.formTemplate).toBeUndefined();
  });
});
