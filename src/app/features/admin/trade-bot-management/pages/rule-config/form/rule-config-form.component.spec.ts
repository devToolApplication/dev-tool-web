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
        { provide: I18nService, useValue: { t: (key: unknown) => String(key ?? '') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RuleConfigFormComponent);
    component = fixture.componentInstance;
  });

  it('loads edit data from mocked APIs and builds dynamic template fields', async () => {
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
    expect(fieldNames).toContain('childRules');

    const childRulesField = component.formConfig.fields.find((field) => field.name === 'childRules');
    expect(childRulesField?.type).toBe('tree');
    if (childRulesField?.type === 'tree') {
      expect(childRulesField.treeConfig?.advancedJson?.collapsedByDefault).toBe(true);
      expect(component.formInitialValue['childRules']).toEqual([
        expect.objectContaining({
          label: 'TEST_CHILD',
          subtitle: 'confirm'
        })
      ]);
    }
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
    expect(fieldNames).toContain('advancedJson');

    const advancedJson = component.formConfig.fields.find((field) => field.name === 'advancedJson');
    expect(advancedJson?.type).toBe('group');
    if (advancedJson?.type === 'group') {
      expect(advancedJson.collapsed).toBe(true);
      expect(advancedJson.children.map((field) => field.name)).toEqual(['configText']);
    }
  });

  it('registers child rule tree validation through FormConfig validators', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const childRulesField = component.formConfig.fields.find((field) => field.name === 'childRules');
    expect(childRulesField?.type).toBe('tree');
    if (childRulesField?.type === 'tree') {
      expect(childRulesField.validation?.some((rule) => rule.validator === 'ruleChildRules')).toBe(true);
    }
    const validator = component.formConfig.validators?.['ruleChildRules'];
    expect(validator).toBeTruthy();
    if (!validator) {
      throw new Error('ruleChildRules validator missing');
    }

    const result = validator(
      [
        {
          id: 'self',
          label: 'TEST_ENTRY_TREND_BUY',
          value: { ruleCode: 'TEST_ENTRY_TREND_BUY' }
        }
      ],
      {
        formValue: { code: 'TEST_ENTRY_TREND_BUY' },
        fieldKey: 'childRules',
        helpers: {
          flattenTree: (value) => value as any[],
          countTreeNodes: () => 1,
          treeDepth: () => 1,
          hasDuplicate: () => false,
          hasDisabledNode: () => false,
          findTreeNode: () => null
        }
      }
    );

    expect(result).not.toBe(true);
    if (result !== true) {
      expect(result[0].message).toBe('tradeBot.validation.selfChildRule');
    }
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
    expect(fieldNames).toEqual(expect.arrayContaining(['config', 'indicators', 'childRules', 'overlay']));
    expect(component.pageConfig.infoSection).toBeNull();
  });

  it('detects circular child rule dependencies from existing rule configs', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const validator = component.formConfig.validators?.['ruleChildRules'];
    expect(validator).toBeTruthy();
    if (!validator) {
      throw new Error('ruleChildRules validator missing');
    }

    const result = validator(
      [
        {
          id: 'child',
          label: 'TEST_CHILD',
          value: { ruleCode: 'TEST_CHILD' },
          data: { ruleCode: 'TEST_CHILD', sourceId: 'rule-child' }
        }
      ],
      {
        formValue: { code: 'TEST_ENTRY_TREND_BUY' },
        fieldKey: 'childRules',
        helpers: {
          flattenTree: (value) => value as any[],
          countTreeNodes: () => 1,
          treeDepth: () => 1,
          hasDuplicate: () => false,
          hasDisabledNode: () => false,
          findTreeNode: () => null
        }
      }
    );

    expect(result).not.toBe(true);
    if (result !== true) {
      expect(result.some((error) =>
        error.message.includes('TEST_ENTRY_TREND_BUY -> TEST_CHILD -> TEST_ENTRY_TREND_BUY')
      )).toBe(true);
    }
  });

  it('detects circular child rule dependencies from nested inline child rules', async () => {
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

    const validator = component.formConfig.validators?.['ruleChildRules'];
    expect(validator).toBeTruthy();
    if (!validator) {
      throw new Error('ruleChildRules validator missing');
    }

    const result = validator(
      [
        {
          id: 'child',
          label: 'TEST_CHILD',
          value: { ruleCode: 'TEST_CHILD' },
          data: { ruleCode: 'TEST_CHILD', sourceId: 'rule-child' }
        }
      ],
      {
        formValue: { code: 'TEST_ENTRY_TREND_BUY' },
        fieldKey: 'childRules',
        helpers: {
          flattenTree: (value) => value as any[],
          countTreeNodes: () => 1,
          treeDepth: () => 1,
          hasDuplicate: () => false,
          hasDisabledNode: () => false,
          findTreeNode: () => null
        }
      }
    );

    expect(result).not.toBe(true);
    if (result !== true) {
      expect(result.some((error) =>
        error.message.includes('TEST_ENTRY_TREND_BUY -> TEST_CHILD -> GROUP -> INLINE_CONFIRM -> TEST_ENTRY_TREND_BUY')
      )).toBe(true);
    }
  });
});
