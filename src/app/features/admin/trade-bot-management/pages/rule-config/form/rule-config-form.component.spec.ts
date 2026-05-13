import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

import {
  ExecutorVersionResponse,
  RuleConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';

import { RuleConfigFormComponent } from './rule-config-form.component';

describe('RuleConfigFormComponent', () => {
  let component: RuleConfigFormComponent;
  let fixture: ComponentFixture<RuleConfigFormComponent>;
  let serviceMock: Pick<TradingSystemService, 'getRuleExecutors' | 'getRuleConfig' | 'saveRuleConfig'>;

  beforeEach(async () => {
    const executors: ExecutorVersionResponse[] = [
      { executor: 'TREND', latestVersion: 'v1', versions: ['v1'] }
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
      overlay: { label: 'Trend entry' },
      formTemplate: {
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
      }
    };

    serviceMock = {
      getRuleExecutors: vi.fn(() => of(executors)),
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
    expect(String(component.formInitialValue['formTemplateText'])).toContain('"lookback"');

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).toContain('formTemplateText');
    expect(fieldNames).toContain('config');
    expect(fieldNames).toContain('indicators');
    expect(fieldNames).toContain('childRules');

    const childRulesField = component.formConfig.fields.find((field) => field.name === 'childRules');
    expect(childRulesField?.type).toBe('array');
    if (childRulesField?.type === 'array') {
      expect(childRulesField.itemConfig.some((field) => field.name === 'config')).toBe(true);
    }
  });
});
