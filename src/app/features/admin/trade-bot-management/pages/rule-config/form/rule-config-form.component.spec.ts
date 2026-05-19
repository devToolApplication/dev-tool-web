import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

import {
  ExecutorVersionResponse,
  IndicatorConfigResponse,
  RuleConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { ConfirmDialogService } from '../../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { FormConfig } from '../../../../../../shared/ui/form-input/models/form-config.model';

import { RuleConfigFormComponent } from './rule-config-form.component';

describe('RuleConfigFormComponent', () => {
  let component: RuleConfigFormComponent;
  let fixture: ComponentFixture<RuleConfigFormComponent>;
  let serviceMock: Pick<
    TradingSystemService,
    'getRuleExecutors' | 'getIndicatorConfigs' | 'getRuleConfigs' | 'getRuleConfig' | 'saveRuleConfig'
  >;

  beforeEach(async () => {
    const trendFormTemplate: FormConfig = {
      fields: [
        {
          name: 'config',
          type: 'group',
          label: 'tradeBot.template.config',
          children: [
            {
              name: 'side',
              type: 'select',
              label: 'tradeBot.template.side',
              options: [
                { label: 'tradeBot.side.buy', value: 'BUY' },
                { label: 'tradeBot.side.sell', value: 'SELL' }
              ]
            },
            { name: 'lookback', type: 'number', label: 'tradeBot.template.lookback', suffix: 'bars' }
          ]
        },
        { name: 'indicators', type: 'input-multi', label: 'tradeBot.template.indicators' },
        {
          name: 'childRules',
          type: 'array',
          label: 'tradeBot.template.childRules',
          itemConfig: [
            { name: 'slotCode', type: 'text', label: 'tradeBot.template.slotCode' },
            { name: 'ruleCode', type: 'text', label: 'tradeBot.template.ruleCode' },
            {
              name: 'config',
              type: 'group',
              label: 'Child rule config',
              children: [
                { name: 'lookback', type: 'number', label: 'tradeBot.template.lookback', suffix: 'bars' }
              ]
            }
          ]
        },
        { name: 'overlay', type: 'record', label: 'tradeBot.template.overlay' }
      ]
    };
    const executors: ExecutorVersionResponse[] = [
      { executor: 'TREND', latestVersion: 'v1', versions: ['v1'], formTemplate: trendFormTemplate }
    ];
    const indicatorConfigs: IndicatorConfigResponse[] = [
      {
        id: 'indicator-1',
        code: 'TEST_CLOSE_PRICE',
        executor: 'CLOSE_PRICE',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ];
    const detail: RuleConfigResponse = {
      id: 'rule-1',
      code: 'TEST_ENTRY_TREND_BUY',
      executor: 'TREND',
      executorVersion: 'v1',
      status: 'ACTIVE',
      indicators: ['TEST_CLOSE_PRICE'],
      config: { side: 'BUY', lookback: 5 },
      childRules: [{ slotCode: 'confirm', ruleCode: 'TEST_CHILD', config: { lookback: 3 } }],
      overlay: { label: 'Trend entry' }
    };
    const childRule: RuleConfigResponse = {
      id: 'rule-child',
      code: 'TEST_CHILD',
      executor: 'TREND',
      executorVersion: 'v1',
      status: 'ACTIVE',
      indicators: [],
      config: {},
      childRules: [{ ruleCode: 'TEST_ENTRY_TREND_BUY', config: {} }],
      overlay: {}
    };

    serviceMock = {
      getRuleExecutors: vi.fn(() => of(executors)),
      getIndicatorConfigs: vi.fn(() => of(indicatorConfigs)),
      getRuleConfigs: vi.fn(() => of([detail, childRule])),
      getRuleConfig: vi.fn(() => of(detail)),
      saveRuleConfig: vi.fn(() => of(detail))
    };

    await TestBed.configureTestingModule({
      declarations: [RuleConfigFormComponent],
      providers: [
        { provide: TradingSystemService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'rule-1' }) } }
        },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: LoadingService, useValue: { track: <T>(source$: Observable<T>) => source$ } },
        { provide: ToastService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: ConfirmDialogService, useValue: { confirm: vi.fn(() => Promise.resolve(true)) } },
        { provide: I18nService, useValue: { t: (key: unknown) => String(key ?? '') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RuleConfigFormComponent);
    component = fixture.componentInstance;
  });

  it('loads edit data and converts legacy childRules into rule expression', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(serviceMock.getRuleExecutors).toHaveBeenCalled();
    expect(serviceMock.getRuleConfig).toHaveBeenCalledWith('rule-1');
    expect(component).toBeTruthy();
    expect(component.formInitialValue['code']).toBe('TEST_ENTRY_TREND_BUY');

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).not.toContain('formTemplateText');
    expect(fieldNames).not.toContain('indicatorsText');
    expect(fieldNames).not.toContain('childRulesText');
    expect(fieldNames).not.toContain('overlayText');
    expect(fieldNames).toContain('config');
    expect(fieldNames).toContain('indicators');
    expect(fieldNames).not.toContain('childRules');
    expect(component.ruleExpressionValue().root).toEqual(
      expect.objectContaining({
        type: 'ruleRef',
        ruleCode: 'TEST_CHILD',
        slotCode: 'confirm'
      })
    );
  });

  it('shows a warning and keeps configText in advanced JSON when executor template is missing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).applyTemplateState(
      {
        code: 'TEST_ENTRY_TREND_BUY',
        executor: 'TREND',
        executorVersion: 'v1',
        status: 'ACTIVE',
        indicators: ['TEST_CLOSE_PRICE'],
        config: { side: 'BUY' },
        childRules: [],
        overlay: {}
      },
      undefined,
      'TREND'
    );

    expect(component.pageConfig.infoSection?.title).toBe('tradeBot.message.missingFormTemplateTitle');
    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).not.toContain('configText');
    expect(fieldNames).not.toContain('childRules');
    expect(fieldNames).toContain('advancedJson');

    const advancedJson = component.formConfig.fields.find((field) => field.name === 'advancedJson');
    expect(advancedJson?.type).toBe('group');
    if (advancedJson?.type === 'group') {
      expect(advancedJson.collapsed).toBe(true);
      expect(advancedJson.children.map((field) => field.name)).toEqual(['configText']);
    }
  });

  it('validates self rule references through the expression builder state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onRuleExpressionValueChange({
      root: { id: 'self', type: 'ruleRef', ruleCode: 'TEST_ENTRY_TREND_BUY' }
    });

    expect(component.ruleExpressionValidation().errors[0].message).toBe('tradeBot.validation.selfChildRule');
  });

  it('adds common editable rule sections when rule template only defines config fields', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).applyTemplateState(
      {
        code: 'TEST_ENTRY_TREND_BUY',
        executor: 'TREND',
        executorVersion: 'v1',
        status: 'ACTIVE',
        indicators: ['TEST_CLOSE_PRICE'],
        config: { side: 'BUY' },
        childRules: [],
        overlay: { label: 'Trend entry' }
      },
      {
        fields: [
          {
            name: 'config',
            type: 'group',
            label: 'tradeBot.template.config',
            children: [{ name: 'side', type: 'text', label: 'tradeBot.template.side' }]
          }
        ]
      },
      'TREND'
    );

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).toEqual(expect.arrayContaining(['config', 'indicators', 'overlay']));
    expect(fieldNames).not.toContain('childRules');
    expect(component.pageConfig.infoSection).toBeNull();
  });

  it('detects circular ruleRef dependencies from existing rule configs', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onRuleExpressionValueChange({
      root: { id: 'child', type: 'ruleRef', ruleCode: 'TEST_CHILD' }
    });

    expect(component.ruleExpressionValidation().errors.some((error) =>
      error.message.includes('TEST_ENTRY_TREND_BUY -> TEST_CHILD -> TEST_ENTRY_TREND_BUY')
    )).toBe(true);
  });

  it('detects circular ruleRef dependencies from nested inline child rules', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).ruleConfigs = [
      {
        id: 'rule-child',
        code: 'TEST_CHILD',
        executor: 'TREND',
        executorVersion: 'v1',
        status: 'ACTIVE',
        indicators: [],
        config: {},
        childRules: [
          {
            code: 'GROUP',
            children: [
              {
                ruleCode: 'INLINE_CONFIRM',
                childRules: [{ ruleCode: 'TEST_ENTRY_TREND_BUY' }]
              }
            ]
          }
        ],
        overlay: {}
      }
    ];

    component.onRuleExpressionValueChange({
      root: { id: 'child', type: 'ruleRef', ruleCode: 'TEST_CHILD' }
    });

    expect(component.ruleExpressionValidation().errors.some((error) =>
      error.message.includes('TEST_ENTRY_TREND_BUY -> TEST_CHILD -> GROUP -> INLINE_CONFIRM -> TEST_ENTRY_TREND_BUY')
    )).toBe(true);
  });

  it('saves ruleExpression in config and derives childRules from active ruleRef nodes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.ruleConfigs = [
      {
        id: 'rule-safe',
        code: 'SAFE_CHILD',
        executor: 'TREND',
        executorVersion: 'v1',
        status: 'ACTIVE',
        indicators: [],
        config: {},
        childRules: [],
        overlay: {}
      }
    ];
    component.onRuleExpressionValueChange({
      root: { id: 'safe-child', type: 'ruleRef', ruleCode: 'SAFE_CHILD', slotCode: 'confirm' }
    });

    component.submit({
      code: 'TEST_ENTRY_TREND_BUY',
      executor: 'TREND',
      executorVersion: 'v1',
      status: 'ACTIVE',
      indicators: ['TEST_CLOSE_PRICE'],
      config: { side: 'BUY', lookback: 5 },
      overlay: { label: 'Trend entry' }
    });

    expect(serviceMock.saveRuleConfig).toHaveBeenCalled();
    const payload = (serviceMock.saveRuleConfig as any).mock.calls[0][1];
    expect(payload.config.ruleExpression.root).toEqual(expect.objectContaining({ type: 'ruleRef', ruleCode: 'SAFE_CHILD' }));
    expect(payload.childRules).toEqual([{ ruleCode: 'SAFE_CHILD', slotCode: 'confirm' }]);
    expect(payload.indicators).toEqual(['TEST_CLOSE_PRICE']);
    expect(payload.overlay).toEqual({ label: 'Trend entry' });
  });
});
