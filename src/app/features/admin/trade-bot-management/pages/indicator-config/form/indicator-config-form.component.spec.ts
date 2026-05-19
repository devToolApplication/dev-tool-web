import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { vi } from 'vitest';

import {
  ExecutorVersionResponse,
  IndicatorConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';

import { IndicatorConfigFormComponent } from './indicator-config-form.component';

describe('IndicatorConfigFormComponent', () => {
  let component: IndicatorConfigFormComponent;
  let fixture: ComponentFixture<IndicatorConfigFormComponent>;
  let serviceMock: Pick<TradingSystemService, 'getIndicatorExecutors' | 'getIndicatorConfigs' | 'getIndicatorConfig' | 'saveIndicatorConfig'>;

  beforeEach(async () => {
    const executors: ExecutorVersionResponse[] = [
      {
        executor: 'PIVOT_HIGH',
        latestVersion: 'v1',
        versions: ['v1'],
        usesConfig: true,
        childSlots: [],
        formTemplate: {
          fields: [
            {
              name: 'config',
              type: 'group',
              label: 'tradeBot.template.config',
              children: [
                { name: 'left', type: 'number', label: 'tradeBot.template.leftBars', suffix: 'bars' },
                { name: 'right', type: 'number', label: 'tradeBot.template.rightBars', suffix: 'bars' }
              ]
            }
          ]
        }
      },
      { executor: 'PIVOT_LOW', latestVersion: 'v1', versions: ['v1'], usesConfig: true, childSlots: [] },
      {
        executor: 'ZIGZAG',
        latestVersion: 'v1',
        versions: ['v1'],
        usesConfig: false,
        childSlots: [
          {
            slotCode: 'pivotHigh',
            labelKey: 'tradeBot.indicator.childSlot.pivotHigh',
            required: true,
            acceptedExecutors: ['PIVOT_HIGH'],
            multiple: false
          },
          {
            slotCode: 'pivotLow',
            labelKey: 'tradeBot.indicator.childSlot.pivotLow',
            required: true,
            acceptedExecutors: ['PIVOT_LOW'],
            multiple: false
          }
        ]
      }
    ];
    const detail: IndicatorConfigResponse = {
      id: 'indicator-1',
      code: 'TEST_ZIGZAG',
      executor: 'ZIGZAG',
      executorVersion: 'v1',
      displayType: 'POINT',
      status: 'ACTIVE',
      config: {},
      children: [
        { slotCode: 'pivotHigh', indicatorCode: 'PH_FAST', config: {} },
        { slotCode: 'pivotLow', indicatorCode: 'PL_FAST', config: {} }
      ],
      overlay: { label: 'ZigZag' }
    };
    const indicatorConfigs: IndicatorConfigResponse[] = [
      detail,
      {
        id: 'pivot-high-1',
        code: 'PH_FAST',
        executor: 'PIVOT_HIGH',
        executorVersion: 'v1',
        config: { left: 2, right: 2 },
        children: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'pivot-low-1',
        code: 'PL_FAST',
        executor: 'PIVOT_LOW',
        executorVersion: 'v1',
        config: { left: 2, right: 2 },
        children: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ];

    serviceMock = {
      getIndicatorExecutors: vi.fn(() => of(executors)),
      getIndicatorConfigs: vi.fn(() => of(indicatorConfigs)),
      getIndicatorConfig: vi.fn(() => of(detail)),
      saveIndicatorConfig: vi.fn(() => of(detail))
    };

    await TestBed.configureTestingModule({
      declarations: [IndicatorConfigFormComponent],
      providers: [
        { provide: TradingSystemService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'indicator-1' }) } }
        },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: LoadingService, useValue: { track: <T>(source$: Observable<T>) => source$ } },
        { provide: ToastService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: I18nService, useValue: { t: (key: unknown) => String(key ?? '') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorConfigFormComponent);
    component = fixture.componentInstance;
  });

  it('loads composite indicator and builds child selector fields without direct config', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(serviceMock.getIndicatorExecutors).toHaveBeenCalled();
    expect(serviceMock.getIndicatorConfigs).toHaveBeenCalled();
    expect(serviceMock.getIndicatorConfig).toHaveBeenCalledWith('indicator-1');
    expect(component).toBeTruthy();
    expect(component.formInitialValue['code']).toBe('TEST_ZIGZAG');
    expect(component.formInitialValue['childSelections']).toEqual({
      pivotHigh: 'PH_FAST',
      pivotLow: 'PL_FAST'
    });

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).not.toContain('formTemplateText');
    expect(fieldNames).not.toContain('configText');
    expect(fieldNames).not.toContain('childrenText');
    expect(fieldNames).toContain('childSelections');
    expect(fieldNames).toContain('overlay');

    const basicInfoField = component.formConfig.fields.find((field) => field.name === 'basicInfo');
    expect(basicInfoField?.type).toBe('group');
    if (basicInfoField?.type === 'group') {
      const displayTypeField = basicInfoField.children.find((field) => field.name === 'displayType');
      expect(displayTypeField?.type).toBe('auto-complete');
      if (displayTypeField?.type === 'auto-complete') {
        expect(displayTypeField.options).toContainEqual({ label: 'POINT', value: 'POINT' });
      }
    }

    const childrenField = component.formConfig.fields.find((field) => field.name === 'childSelections');
    expect(childrenField?.type).toBe('group');
    if (childrenField?.type === 'group') {
      expect(childrenField.children.map((field) => field.name)).toEqual(['pivotHigh', 'pivotLow']);
      const pivotHighField = childrenField.children.find((field) => field.name === 'pivotHigh');
      expect(pivotHighField?.type).toBe('select');
      if (pivotHighField?.type === 'select') {
        expect(pivotHighField.options).toEqual([{ label: 'PH_FAST - PIVOT_HIGH/v1 [ACTIVE]', value: 'PH_FAST' }]);
      }
    }
  });

  it('maps composite child selections to indicator children payload', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const payload = (component as any).toPayload({
      code: 'TEST_ZIGZAG',
      executor: 'ZIGZAG',
      executorVersion: 'v1',
      displayType: 'POINT',
      status: 'ACTIVE',
      childSelections: {
        pivotHigh: 'PH_FAST',
        pivotLow: 'PL_FAST'
      },
      overlay: { label: 'ZigZag' }
    });

    expect(payload.config).toEqual({});
    expect(payload.children).toEqual([
      { slotCode: 'pivotHigh', indicatorCode: 'PH_FAST', config: {} },
      { slotCode: 'pivotLow', indicatorCode: 'PL_FAST', config: {} }
    ]);
    expect(payload.overlay).toEqual({ label: 'ZigZag' });
  });

  it('shows a warning and keeps raw JSON inside advanced fields when executor template is missing', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).applyTemplateState(
      {
        code: 'TEST_PIVOT',
        executor: 'PIVOT_HIGH',
        executorVersion: 'v1',
        displayType: 'POINT',
        status: 'ACTIVE',
        config: { left: 2 },
        children: [],
        overlay: {}
      },
      undefined,
      'PIVOT_HIGH'
    );

    expect(component.pageConfig.infoSection?.title).toBe('tradeBot.message.missingFormTemplateTitle');
    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).not.toContain('configText');
    expect(fieldNames).not.toContain('childrenText');
    expect(fieldNames).toContain('advancedJson');

    const advancedJson = component.formConfig.fields.find((field) => field.name === 'advancedJson');
    expect(advancedJson?.type).toBe('group');
    if (advancedJson?.type === 'group') {
      expect(advancedJson.collapsed).toBe(true);
      expect(advancedJson.children.map((field) => field.name)).toEqual(['configText', 'childrenText']);
    }
  });

  it('adds overlay as a common editable section when indicator template omits overlay', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    (component as any).applyTemplateState(
      {
        code: 'TEST_PIVOT',
        executor: 'PIVOT_HIGH',
        executorVersion: 'v1',
        displayType: 'POINT',
        status: 'ACTIVE',
        config: { left: 2 },
        children: [],
        overlay: { color: 'green' }
      },
      {
        fields: [
          {
            name: 'config',
            type: 'group',
            label: 'tradeBot.template.config',
            children: [{ name: 'left', type: 'number', label: 'tradeBot.template.leftBars' }]
          }
        ]
      },
      'PIVOT_HIGH'
    );

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).toContain('config');
    expect(fieldNames).toContain('overlay');
    expect(component.pageConfig.infoSection).toBeNull();
  });

  it('uses executor formTemplate metadata to build standard indicator config fields', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onValueChange({
      code: 'TEST_PIVOT_HIGH',
      executor: 'PIVOT_HIGH',
      executorVersion: 'v1',
      displayType: 'POINT',
      status: 'ACTIVE',
      config: { left: 2, right: 2 },
      children: [],
      overlay: {}
    });

    const fieldNames = component.formConfig.fields.map((field) => field.name);
    expect(fieldNames).toContain('config');
    expect(fieldNames).toContain('overlay');
    expect(fieldNames).not.toContain('advancedJson');
    expect(component.pageConfig.infoSection).toBeNull();

    const configField = component.formConfig.fields.find((field) => field.name === 'config');
    expect(configField?.type).toBe('group');
    if (configField?.type === 'group') {
      expect(configField.children.map((field) => field.name)).toEqual(['left', 'right']);
    }
  });
});
