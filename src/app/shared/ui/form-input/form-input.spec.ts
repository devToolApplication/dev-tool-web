import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { Button } from '../../component/button/button';


import { FormInput } from './form-input';
import { ArrayFieldState, FormConfig, FormContext } from './models/form-config.model';
import { FormSectionCardComponent } from './component/form-section-card/form-section-card';
import { FieldTreeRendererComponent } from './component/field-tree-renderer/field-tree-renderer';

describe('FormInput', () => {
  let component: FormInput;
  let fixture: ComponentFixture<FormInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(FormInput);
    component = fixture.componentInstance;
    component.config = { fields: [] };
    component.context = { user: null };
    component.initialValue = {};
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps partial-width fields full width on mobile breakpoints', () => {
    expect(component.getCol('1/2')).toBe('col-span-12 md:col-span-6');
    expect(component.getCol('1/3')).toBe('col-span-12 md:col-span-4');
  });

  it('flattens group and array children without throwing during dirty or validation checks', async () => {
    component.config = {
      fields: [
        {
          type: 'group',
          name: 'settings',
          label: 'Settings',
          children: [
            {
              type: 'text',
              name: 'name',
              label: 'Name'
            }
          ]
        },
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          itemConfig: [
            {
              type: 'text',
              name: 'code',
              label: 'Code'
            }
          ]
        }
      ]
    };
    component.initialValue = {
      settings: { name: 'Default' },
      items: [{ code: 'A1' }]
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: { fields: [] },
        firstChange: false,
        isFirstChange: () => false
      },
      initialValue: {
        currentValue: component.initialValue,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(() => component.isDirty()).not.toThrow();
    expect(() => component.validationSummaryItems()).not.toThrow();
    expect(() => component.resetDirtyState()).not.toThrow();
  });

  it('keeps array child states stable across same-length value updates', () => {
    applyConfig({
      fields: [
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          itemConfig: [
            {
              type: 'text',
              name: 'code',
              label: 'Code'
            }
          ]
        }
      ]
    }, {
      items: [{ code: 'A1' }, { code: 'B1' }]
    });

    const arrayField = component.engine.fields[0] as ArrayFieldState;
    const firstCodeField = arrayField.children()[0][0];
    const secondCodeField = arrayField.children()[1][0];

    firstCodeField.setValue('A2');

    expect(arrayField.children()[0][0]).toBe(firstCodeField);
    expect(arrayField.children()[1][0]).toBe(secondCodeField);
    expect(firstCodeField.value()).toBe('A2');

    arrayField.arrayState?.removeItem(0);

    const childrenAfterRemove = arrayField.children();
    expect(childrenAfterRemove.length).toBe(1);
    expect(childrenAfterRemove[0][0]).not.toBe(firstCodeField);
    expect(childrenAfterRemove[0][0].path).toBe('items.0.code');
    expect(childrenAfterRemove[0][0].value()).toBe('B1');
  });

  it('updates submit disabled state without rebuilding sections for loading-only changes', () => {
    applyConfig({
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'Name'
        }
      ]
    }, {
      name: 'Ready'
    });

    const sectionsBeforeLoading = component.renderSections();

    component.loading = true;
    component.ngOnChanges({
      loading: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.submitDisabled()).toBe(true);
    expect(component.renderSections()).toBe(sectionsBeforeLoading);
  });

  it('renders generic required field type aliases without falling back to an unsupported field state', () => {
    applyConfig({
      fields: [
        { type: 'decimal', name: 'decimalValue', label: 'Decimal' },
        { type: 'percent', name: 'ratio', label: 'Ratio' },
        { type: 'currency', name: 'price', label: 'Price', currency: 'USD' },
        {
          type: 'multi-select',
          name: 'channels',
          label: 'Channels',
          options: [{ label: 'Web', value: 'web' }]
        },
        {
          type: 'autocomplete',
          name: 'owner',
          label: 'Owner',
          options: [{ label: 'Ops', value: 'ops' }]
        },
        { type: 'boolean', name: 'enabled', label: 'Enabled' },
        { type: 'datetime', name: 'startsAt', label: 'Starts At' },
        { type: 'json', name: 'payload', label: 'Payload' },
        { type: 'code', name: 'script', label: 'Script' },
        {
          type: 'tags',
          name: 'tags',
          label: 'Tags',
          options: [{ label: 'Blue', value: 'blue' }]
        }
      ]
    }, {
      decimalValue: 1.2,
      ratio: 10,
      price: 25,
      channels: ['web'],
      owner: 'ops',
      enabled: true,
      startsAt: new Date('2026-05-15T00:00:00Z'),
      payload: '{"ok":true}',
      script: 'return true;',
      tags: ['blue']
    });

    expect(fixture.nativeElement.querySelectorAll('app-input-number').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('app-select-multi').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('app-auto-complete').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('app-check-box').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('app-date-picker').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('app-input-area').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('app-input-multi').length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('shared.form.unsupportedFieldType');
  });

  it('renders composite field types and an unsupported type fallback without crashing', () => {
    applyConfig({
      layout: {
        sectionNavigation: 'none',
        showStatusPanel: false
      },
      fields: [
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          itemConfig: [{ type: 'text', name: 'code', label: 'Code' }]
        },
        {
          type: 'record',
          name: 'headers',
          label: 'Headers',
          keyLabel: 'Header name',
          valueLabel: 'Header value'
        },
        {
          type: 'tree',
          name: 'rules',
          label: 'Rules',
          treeConfig: {
            advancedJson: {
              enabled: true,
              collapsedByDefault: true
            }
          }
        },
        {
          type: 'secret-metadata',
          name: 'secrets',
          label: 'Secrets'
        },
        {
          type: 'unsupported',
          name: 'legacy',
          label: 'Legacy'
        } as never
      ]
    }, {
      items: [],
      headers: {},
      rules: [],
      secrets: [],
      legacy: 'legacy-value'
    });

    expect(fixture.nativeElement.querySelector('app-field-array-renderer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-field-record-renderer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-field-tree-renderer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-field-secret-metadata-renderer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-alert')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('shared.form.unsupportedFieldType');
  });

  it('reruns tree validation when editable advanced JSON applies a new value', () => {
    applyConfig({
      fields: [
        {
          type: 'tree',
          name: 'rules',
          label: 'Rules',
          validation: [
            {
              type: 'expression',
              expression: 'helpers.countTreeNodes(value) > 1',
              message: 'Use at most one rule'
            }
          ],
          treeConfig: {
            advancedJson: {
              enabled: true,
              editable: true,
              collapsedByDefault: true
            }
          }
        }
      ]
    }, {
      rules: []
    });

    const tree = fixture.debugElement.query(By.directive(FieldTreeRendererComponent))
      .componentInstance as FieldTreeRendererComponent;

    tree.onAdvancedJsonChange(
      '[{"id":"rule-1","label":"Rule 1","value":"rule-1"},{"id":"rule-2","label":"Rule 2","value":"rule-2"}]'
    );
    tree.applyAdvancedJson();

    expect(component.engine.fields[0].value()).toHaveLength(2);
    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'rules', message: 'Use at most one rule' })
    ]);

    tree.onAdvancedJsonChange('[{"id":"rule-1","label":"Rule 1","value":"rule-1"}]');
    tree.applyAdvancedJson();

    expect(component.validationSummaryItems()).toEqual([]);
  });

  it('validates before submit, blocks double submit and exposes API field errors', () => {
    applyConfig({
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'Name',
          validation: [{ type: 'required', message: 'Name is required' }]
        }
      ]
    }, { name: '' });

    const submitted: unknown[] = [];
    component.formSubmit.subscribe((value) => submitted.push(value));

    component.onSubmit();
    expect(submitted).toEqual([]);
    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'name', message: 'Name is required' })
    ]);

    component.engine.fields[0].setValue('Ready');
    component.submitting = true;
    component.onSubmit();
    expect(submitted).toEqual([]);

    component.submitting = false;
    component.onSubmit();
    component.submitting = true;
    component.onSubmit();
    expect(submitted).toEqual([{ name: 'Ready' }]);

    component.apiFieldErrors = { name: 'Name already exists' };
    component.ngOnChanges({
      apiFieldErrors: {
        currentValue: component.apiFieldErrors,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'name', message: 'Name already exists' })
    ]);

    component.engine.fields[0].setValue('Unique');

    expect(component.validationSummaryItems()).toEqual([]);
  });

  it('validates min, max, regex, expression and custom rules without crashing on runtime errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    applyConfig({
      fields: [
        {
          type: 'number',
          name: 'minAge',
          label: 'Minimum age',
          validation: [{ type: 'min', value: 18, message: 'Use at least 18' }]
        },
        {
          type: 'number',
          name: 'maxOrders',
          label: 'Max orders',
          validation: [{ type: 'max', value: 10, message: 'Use 10 or less' }]
        },
        {
          type: 'text',
          name: 'code',
          label: 'Code',
          validation: [{ type: 'regex', value: '^[A-Z]+$', message: 'Use uppercase letters' }]
        },
        {
          type: 'number',
          name: 'limit',
          label: 'Limit',
          validation: [
            {
              type: 'expression',
              expression: 'model.limit <= model.minAge',
              message: 'Limit must be greater than minimum age'
            },
            {
              type: 'expression',
              expression: 'model.unknown.call()',
              message: 'Runtime errors do not crash validation',
              severity: 'warning'
            }
          ]
        },
        {
          type: 'text',
          name: 'owner',
          label: 'Owner',
          validation: [{ type: 'custom', validator: 'notReserved', message: 'Reserved owner' }]
        }
      ],
      validators: {
        notReserved: (value) =>
          value === 'root'
            ? [{ fieldPath: 'owner', message: 'Reserved owner' }]
            : true
      }
    }, {
      minAge: 16,
      maxOrders: 12,
      code: 'abc',
      limit: 10,
      owner: 'root'
    });

    expect(() => component.engine.valid()).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith('[Runtime Error]', expect.any(Object));
    component.onSubmit();

    expect(component.validationSummaryItems()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldPath: 'minAge', message: 'Use at least 18' }),
        expect.objectContaining({ fieldPath: 'maxOrders', message: 'Use 10 or less' }),
        expect.objectContaining({ fieldPath: 'code', message: 'Use uppercase letters' }),
        expect.objectContaining({ fieldPath: 'limit', message: 'Limit must be greater than minimum age' }),
        expect.objectContaining({ fieldPath: 'owner', message: 'Reserved owner' })
      ])
    );

    component.engine.fields[0].setValue(18);
    component.engine.fields[1].setValue(10);
    component.engine.fields[2].setValue('ABC');
    component.engine.fields[3].setValue(19);
    component.engine.fields[4].setValue('operator');

    expect(component.validationSummaryItems()).toEqual([]);
    consoleError.mockRestore();
  });

  it('does not crash on null or undefined optional values and validates record fields through the shared engine', () => {
    applyConfig({
      fields: [
        {
          type: 'text',
          name: 'nullableCode',
          label: 'Nullable code',
          validation: [{ type: 'regex', value: '^[A-Z]+$', message: 'Use uppercase letters' }]
        },
        {
          type: 'number',
          name: 'optionalLimit',
          label: 'Optional limit',
          validation: [{ type: 'min', value: 1, message: 'Use at least 1' }]
        },
        {
          type: 'record',
          name: 'metadata',
          label: 'Metadata',
          keyLabel: 'Key',
          valueLabel: 'Value',
          requiredWhen: 'model.needMetadata === true',
          requiredWhenMessage: 'Metadata is required'
        }
      ]
    }, {
      nullableCode: undefined,
      optionalLimit: null,
      needMetadata: true,
      metadata: {}
    });

    expect(() => component.onSubmit()).not.toThrow();
    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'metadata', message: 'Metadata is required' })
    ]);

    component.engine.fields[2].setValue({ env: 'prod' });

    expect(component.engine.valid()).toBe(true);
  });

  it('uses translated JSON validation and clears field state on initial value reset', () => {
    applyConfig({
      fields: [
        {
          type: 'json',
          name: 'payload',
          label: 'Payload'
        }
      ]
    }, { payload: '{bad json' });

    const field = component.engine.fields[0];

    component.onSubmit();

    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'payload', message: 'shared.json.invalid' })
    ]);

    component.apiFieldErrors = { payload: 'Payload rejected' };
    component.ngOnChanges({
      apiFieldErrors: {
        currentValue: component.apiFieldErrors,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false
      }
    });
    expect(field.externalErrors()).toEqual({ 'api-0': 'Payload rejected' });

    field.setValue('{"ok":true}');
    expect(field.externalErrors()).toBeNull();
    expect(field.dirty()).toBe(true);

    component.initialValue = { payload: '{"reset":true}' };
    component.ngOnChanges({
      initialValue: {
        currentValue: component.initialValue,
        previousValue: { payload: '{"ok":true}' },
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(field.value()).toBe('{"reset":true}');
    expect(field.dirty()).toBe(false);
    expect(field.touched()).toBe(false);
    expect(field.externalErrors()).toBeNull();
  });

  it('renders non-field API errors as a form alert', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FormInput);
    component = fixture.componentInstance;
    component.config = {
      fields: [
        { type: 'text', name: 'name', label: 'Name' }
      ]
    };
    component.context = { user: null };
    component.initialValue = { name: 'Ready' };
    component.apiError = 'Save failed';
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-alert')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Save failed');
  });

  it('supports visibleWhen, disabledWhen and requiredWhen aliases', () => {
    applyConfig({
      fields: [
        {
          type: 'text',
          name: 'approvalCode',
          label: 'Approval code',
          visibleWhen: 'model.showApproval === true',
          disabledWhen: 'model.lockApproval === true',
          requiredWhen: 'model.needApproval === true',
          requiredWhenMessage: 'Approval code is required'
        }
      ]
    }, {
      showApproval: true,
      lockApproval: true,
      needApproval: true,
      approvalCode: ''
    });

    const field = component.engine.fields[0];

    expect(field.visible()).toBe(true);
    expect(field.disabled()).toBe(true);
    expect(field.required()).toBe(true);
    expect(field.errors()).toEqual({
      'error-required': 'Approval code is required'
    });

    field.setValue('APR-1');

    expect(field.errors()).toBeNull();
  });

  it('validates array and tree requiredWhen through the shared form engine', () => {
    applyConfig({
      fields: [
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          itemConfig: [{ type: 'text', name: 'code', label: 'Code' }],
          requiredWhen: 'model.needItems === true',
          requiredWhenMessage: 'At least one item is required'
        },
        {
          type: 'tree',
          name: 'rules',
          label: 'Rules',
          requiredWhen: 'model.needRules === true',
          requiredWhenMessage: 'At least one rule is required',
          treeConfig: {
            advancedJson: {
              enabled: true,
              collapsedByDefault: true
            }
          }
        }
      ]
    }, {
      needItems: true,
      needRules: true,
      items: [],
      rules: []
    });

    component.onSubmit();

    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({ fieldPath: 'items', message: 'At least one item is required' }),
      expect.objectContaining({ fieldPath: 'rules', message: 'At least one rule is required' })
    ]);

    component.engine.fields[0].arrayState.addItem();
    component.engine.fields[1].setValue([{ id: 'rule-1', label: 'Rule 1', value: 'rule-1' }]);

    expect(component.engine.valid()).toBe(true);
  });

  it('renders explicit smart sections and keeps save available for invalid forms', () => {
    applyConfig({
      title: 'shared.form.section.general',
      sections: [
        { id: 'general', title: 'shared.form.section.general' },
        { id: 'advanced', title: 'shared.form.advancedJson' }
      ],
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'Name',
          sectionId: 'general',
          validation: [{ type: 'required', message: 'Name is required' }]
        },
        {
          type: 'json',
          name: 'payload',
          label: 'Payload',
          sectionId: 'advanced'
        }
      ]
    }, { name: '', payload: '{}' });

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('app-smart-form-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-form-section-card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('app-form-section-nav')).toBeTruthy();
    expect(submitButton.disabled).toBe(false);

    component.onSubmit();
    fixture.detectChanges();

    expect(component.validationSummaryItems()).toEqual([
      expect.objectContaining({
        fieldPath: 'name',
        section: 'shared.form.section.general',
        message: 'Name is required'
      })
    ]);
    expect(fixture.nativeElement.querySelector('app-validation-summary')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.form-section-card--error')).toBeTruthy();

    const targetField = fixture.nativeElement.querySelector('[data-field-path="name"]') as HTMLElement;
    targetField.scrollIntoView = vi.fn();
    targetField.focus = vi.fn();

    component.onSummaryItemClick(component.validationSummaryItems()[0]);

    expect(targetField.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(targetField.focus).toHaveBeenCalled();
  });

  it('can disable save for invalid forms when the form config opts in', () => {
    applyConfig({
      actions: {
        disableSubmitWhenInvalid: true
      },
      fields: [
        {
          type: 'text',
          name: 'name',
          label: 'Name',
          validation: [{ type: 'required', message: 'Name is required' }]
        }
      ]
    }, {
      name: ''
    });

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    component.engine.fields[0].setValue('Ready');
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('keeps advanced sections collapsed by default and expands on request', () => {
    applyConfig({
      sections: [
        { id: 'general', title: 'shared.form.section.general' },
        {
          id: 'advanced',
          title: 'shared.form.advancedJson',
          description: 'Advanced payload',
          collapsible: true,
          collapsed: true
        }
      ],
      fields: [
        { type: 'text', name: 'name', label: 'Name', sectionId: 'general' },
        { type: 'json', name: 'payload', label: 'Payload', sectionId: 'advanced' }
      ]
    }, {
      name: 'Config',
      payload: '{"enabled":true}'
    });

    const advancedCard = fixture.debugElement
      .queryAll(By.directive(FormSectionCardComponent))
      .map((debugElement) => debugElement.componentInstance as FormSectionCardComponent)
      .find((card) => card.section.id === 'advanced');

    expect(advancedCard).toBeTruthy();
    expect(advancedCard?.collapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-json-field-block')).toBeFalsy();

    advancedCard?.toggleCollapsed();
    fixture.detectChanges();

    expect(advancedCard?.collapsed()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-json-field-block')).toBeTruthy();
  });

  it('enables reset only when dirty and restores the initial value', () => {
    applyConfig({
      actions: {
        showReset: true
      },
      fields: [
        { type: 'text', name: 'name', label: 'Name' }
      ]
    }, {
      name: 'Initial'
    });

    let resetButton = resetActionButton();
    expect(resetButton.disabled).toBe(true);

    component.engine.fields[0].setValue('Changed');
    fixture.detectChanges();

    resetButton = resetActionButton();
    expect(component.isDirty()).toBe(true);
    expect(resetButton.disabled).toBe(false);

    resetButton.buttonClick.emit();
    fixture.detectChanges();

    expect(component.getModel()).toEqual({ name: 'Initial' });
    expect(component.isDirty()).toBe(false);
    expect(resetActionButton().disabled).toBe(true);
  });

  it('auto-generates practical sections for legacy configs without sections', () => {
    applyConfig({
      fields: [
        { type: 'text', name: 'name', label: 'Name' },
        { type: 'textarea', name: 'description', label: 'Description' },
        { type: 'json', name: 'payload', label: 'Payload' }
      ]
    }, {
      name: 'Legacy config',
      description: 'Long operator note',
      payload: '{}'
    });

    expect(component.renderSections().map((section) => section.id)).toEqual([
      'general',
      'details',
      'configuration'
    ]);
    expect(fixture.nativeElement.querySelectorAll('app-form-section-card').length).toBe(3);
  });

  it('renders view mode as readonly detail fields instead of disabled inputs', () => {
    applyConfig({
      fields: [
        { type: 'text', name: 'code', label: 'Code' },
        { type: 'json', name: 'payload', label: 'Payload' }
      ]
    }, {
      code: 'FORM_A',
      payload: '{"enabled":true}'
    }, {
      user: null,
      mode: 'view'
    });

    expect(fixture.nativeElement.querySelectorAll('app-readonly-field').length).toBe(2);
    expect(fixture.nativeElement.querySelector('app-json-field-block')).toBeFalsy();
  });

  function applyConfig(config: FormConfig, initialValue: unknown, context: FormContext = { user: null }): void {
    fixture.destroy();
    fixture = TestBed.createComponent(FormInput);
    component = fixture.componentInstance;
    component.config = config;
    component.context = context;
    component.initialValue = initialValue;
    fixture.detectChanges();
  }

  function resetActionButton(): Button {
    const buttonDebugElement = fixture.debugElement
      .queryAll(By.directive(Button))
      .find((debugElement) => (debugElement.componentInstance as Button).label === 'reset');

    if (!buttonDebugElement) {
      throw new Error('Reset action button was not rendered');
    }

    return buttonDebugElement.componentInstance as Button;
  }
});
