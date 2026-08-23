import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SharedModule } from '@shared/shared.module';
import { provideSharedTesting } from '@shared/testing/shared-test.providers';

import { FormInput } from './form-input';
import { ArrayFieldState, FormConfig, FormContext } from './models/form-config.model';

@Component({
  standalone: false,
  template: `
    <app-form-input
      [config]="config"
      [context]="context"
      [initialValue]="model"
      [loading]="loading"
      [submitting]="submitting"
      (formSubmit)="onSubmit($event)"
    >
      <div form-actions>
        <button type="button" data-testid="cancel-btn" (click)="onCancel()">Cancel</button>
        <button type="submit" data-testid="save-btn">Save</button>
      </div>
    </app-form-input>
  `,
})
class FormInputHostComponent {
  config: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'title',
        label: 'Title',
        validation: [{ type: 'required', message: 'Title is required' }],
      },
    ],
  };
  context: FormContext = { user: null };
  model = { title: '' };
  loading = false;
  submitting = false;

  submitSpy = vi.fn();
  cancelSpy = vi.fn();

  onSubmit(value: unknown): void {
    this.submitSpy(value);
  }

  onCancel(): void {
    this.cancelSpy();
  }
}

@Component({
  standalone: false,
  template: `
    <app-form-input [config]="config" [initialValue]="firstModel"></app-form-input>
    <app-form-input [config]="config" [initialValue]="secondModel"></app-form-input>
  `,
})
class TwoFormHostComponent {
  config: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        validation: [{ type: 'required', message: 'Name is required' }],
      },
    ],
  };
  firstModel = { name: '' };
  secondModel = { name: '' };
}

@NgModule({
  declarations: [FormInputHostComponent, TwoFormHostComponent],
  imports: [SharedModule, FormsModule],
})
class FormHostTestModule {}

describe('FormInput', () => {
  let component: FormInput;
  let fixture: ComponentFixture<FormInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHostTestModule, SharedModule],

      providers: provideSharedTesting(),
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

  it('recomputes layout after config input changes', () => {
    component.config = {
      layout: { density: 'comfortable' },
      fields: [{ type: 'text', name: 'a', label: 'A' }],
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    expect(component.layout().density).toBe('comfortable');

    component.config = {
      layout: { density: 'compact' },
      fields: [{ type: 'text', name: 'a', label: 'A' }],
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    expect(component.layout().density).toBe('compact');
  });

  it('recomputes submitDisabled when loading or submitting changes', () => {
    component.loading = false;
    component.submitting = false;
    component.ngOnChanges({});
    fixture.detectChanges();
    expect(component.submitDisabled()).toBe(false);

    component.loading = true;
    component.ngOnChanges({
      loading: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    expect(component.submitDisabled()).toBe(true);
  });

  it('tracks the rebuilt engine instead of the old engine', () => {
    applyConfig(
      {
        fields: [{ type: 'text', name: 'first', label: 'First' }],
      },
      { first: 'initial' },
    );
    const firstEngine = component.engine();

    applyConfig(
      {
        fields: [{ type: 'text', name: 'second', label: 'Second' }],
      },
      { second: 'updated' },
    );
    const secondEngine = component.engine();

    expect(secondEngine).not.toBe(firstEngine);
    expect(component.getModel()).toEqual({ second: 'updated' });
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
              label: 'Name',
            },
          ],
        },
        {
          type: 'array',
          name: 'items',
          label: 'Items',
          itemConfig: [
            {
              type: 'text',
              name: 'sku',
              label: 'SKU',
            },
          ],
        },
      ],
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.renderSections().length).toBeGreaterThan(0);
    expect(component.isDirty()).toBe(false);
  });

  it('keeps array child states stable across same-length value updates', async () => {
    applyConfig(
      {
        fields: [
          {
            type: 'array',
            name: 'items',
            label: 'Items',
            itemConfig: [{ type: 'text', name: 'title', label: 'Title' }],
          },
        ],
      },
      {
        items: [{ title: 'One' }, { title: 'Two' }],
      },
    );

    const arrayField = component.engine()?.fields[0] as ArrayFieldState;
    const initialChild = arrayField.children()[0]?.[0];

    arrayField.setValue([{ title: 'One updated' }, { title: 'Two' }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(arrayField.children()[0]?.[0]).toBe(initialChild);
    expect(arrayField.children()[0]?.[0]?.value()).toBe('One updated');
  });

  it('updates submit disabled state without rebuilding sections for loading-only changes', () => {
    applyConfig(
      {
        fields: [{ type: 'text', name: 'name', label: 'Name' }],
      },
      { name: 'Alpha' },
    );

    const sectionsBefore = component.renderSections();

    component.loading = true;
    component.ngOnChanges({
      loading: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();

    expect(component.submitDisabled()).toBe(true);
    expect(component.renderSections()).toBe(sectionsBefore);
  });

  it('renders generic required field type aliases without falling back to an unsupported field state', async () => {
    applyConfig(
      {
        fields: [
          { type: 'text', name: 'title', label: 'Title', required: true },
          { type: 'number', name: 'age', label: 'Age', required: true },
          {
            type: 'select',
            name: 'role',
            label: 'Role',
            required: true,
            options: [{ label: 'Admin', value: 'admin' }],
          },
          { type: 'boolean', name: 'active', label: 'Active', required: true },
        ],
      },
      {
        title: 'Lead',
        age: 30,
        role: 'admin',
        active: true,
      },
    );

    expect(fixture.nativeElement.querySelector('app-alert')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-input-text')).toBeTruthy();
  });

  it('renders detail readonly mode as presentation output without editor controls', () => {
    applyConfig(
      {
        layout: { readonlyMode: 'detail' },
        fields: [
          { type: 'text', name: 'title', label: 'Title' },
          { type: 'number', name: 'count', label: 'Count' },
          { type: 'date', name: 'dueDate', label: 'Due date' },
          {
            type: 'select',
            name: 'role',
            label: 'Role',
            options: [{ label: 'Admin', value: 'admin' }],
          },
          { type: 'boolean', name: 'active', label: 'Active' },
          { type: 'json', name: 'payload', label: 'Payload' },
        ],
      },
      {
        title: 'Read only title',
        count: 7,
        dueDate: new Date(2026, 1, 10),
        role: 'admin',
        active: true,
        payload: { key: 'value' },
      },
      { user: null, mode: 'view' },
    );

    expect(component.readonlyMode()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-value-display')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-input-text')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-input-number')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-date-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-check-box')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-json-field-block')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-json-viewer')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Read only title');
    expect(fixture.nativeElement.textContent).toContain('Admin');
  });

  it('renders scalar fields through one label/help/error shell with ARIA linkage', () => {
    applyConfig(
      {
        fields: [
          {
            type: 'text',
            name: 'title',
            label: 'Title',
            helpText: 'Title help',
            required: true,
            validation: [{ type: 'required', message: 'Title required' }],
          },
          { type: 'number', name: 'count', label: 'Count', helpText: 'Count help' },
          {
            type: 'select',
            name: 'role',
            label: 'Role',
            options: [{ label: 'Admin', value: 'admin' }],
          },
          { type: 'boolean', name: 'active', label: 'Active' },
          { type: 'date', name: 'dueDate', label: 'Due date' },
          { type: 'textarea', name: 'notes', label: 'Notes' },
        ],
      },
      {
        title: '',
        count: 3,
        role: 'admin',
        active: true,
        dueDate: new Date(2026, 1, 10),
        notes: 'Notes',
      },
    );

    component.onSubmit();
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('label'),
    ) as HTMLLabelElement[];
    const titleLabels = labels.filter((label) => label.textContent?.includes('Title'));
    expect(titleLabels.length).toBe(1);

    const titleInput = fixture.nativeElement.querySelector(
      'app-input-text input',
    ) as HTMLInputElement;
    const titleFieldBlock = titleInput.closest('app-field-block') as HTMLElement;
    expect(titleLabels[0].getAttribute('for')).toBe(titleInput.id);
    expect(titleInput.getAttribute('aria-describedby')).toBe(`${titleInput.id}-error`);
    expect(titleFieldBlock.textContent?.match(/Title required/g)?.length).toBe(1);

    const selectButton = fixture.nativeElement.querySelector(
      'app-select button',
    ) as HTMLButtonElement;
    const roleLabel = labels.find((label) => label.textContent?.includes('Role'));
    expect(roleLabel?.getAttribute('for')).toBe(selectButton.id);

    const numberInput = fixture.nativeElement.querySelector(
      'app-input-number input',
    ) as HTMLInputElement;
    const countFieldBlock = numberInput.closest('app-field-block') as HTMLElement;
    expect(countFieldBlock.textContent?.match(/Count help/g)?.length).toBe(1);

    const describedControls = [
      titleInput,
      numberInput,
      selectButton,
      fixture.nativeElement.querySelector('app-check-box input') as HTMLInputElement,
      fixture.nativeElement.querySelector('app-date-picker input') as HTMLInputElement,
      fixture.nativeElement.querySelector('app-input-area textarea') as HTMLTextAreaElement,
    ];
    describedControls.forEach((control) => expect(control.id).toBeTruthy());
  });

  it('keeps disabled editor controls when readonlyMode is disabled-controls', () => {
    applyConfig(
      {
        layout: { readonlyMode: 'disabled-controls' },
        fields: [{ type: 'text', name: 'title', label: 'Title' }],
      },
      { title: 'Disabled editor title' },
      { user: null, mode: 'view' },
    );

    expect(component.readonlyMode()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-input-text')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-value-display')).toBeNull();
  });

  it('treats feature-owned field types as unsupported shared form config', () => {
    applyConfig(
      {
        fields: [
          {
            type: 'feature-owned-field',
            name: 'featureField',
            label: 'Feature field',
          } as unknown as FormConfig['fields'][number],
        ],
      },
      {
        featureField: {},
      },
    );

    expect(fixture.nativeElement.querySelector('app-alert')).toBeTruthy();
  });

  it('validates before submit, blocks double submit and exposes external field errors', () => {
    applyConfig(
      {
        fields: [
          {
            type: 'text',
            name: 'name',
            label: 'Name',
            validation: [{ type: 'required', message: 'Name is required' }],
          },
        ],
      },
      { name: '' },
    );

    const submitSpy = vi.spyOn(component.formSubmit, 'emit');

    component.onSubmit();
    fixture.detectChanges();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.validationSummaryItems().length).toBe(1);

    component.engine()?.fields[0].setValue('Valid Name');
    fixture.detectChanges();

    component.onSubmit();
    expect(submitSpy).toHaveBeenCalledWith({ name: 'Valid Name' });

    submitSpy.mockClear();
    component.submitting = true;
    component.ngOnChanges({
      submitting: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    component.onSubmit();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('renders explicit smart sections and allows focus on invalid fields', () => {
    applyConfig(
      {
        sections: [
          { id: 'general', title: 'General' },
          { id: 'advanced', title: 'Advanced' },
        ],
        fields: [
          {
            type: 'text',
            name: 'name',
            label: 'Name',
            sectionId: 'general',
            validation: [{ type: 'required', message: 'Name is required' }],
          },
          {
            type: 'json',
            name: 'payload',
            label: 'Payload',
            sectionId: 'advanced',
          },
        ],
      },
      { name: '', payload: '{}' },
    );

    component.onSubmit();
    fixture.detectChanges();

    expect(component.validationSummaryItems().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('app-validation-summary')).toBeTruthy();

    const targetField = fixture.nativeElement.querySelector(
      '[data-field-path="name"]',
    ) as HTMLElement;
    if (targetField) {
      targetField.scrollIntoView = vi.fn();
      targetField.focus = vi.fn();
      component.onSummaryItemClick(component.validationSummaryItems()[0]);
      expect(targetField.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
      expect(targetField.focus).toHaveBeenCalled();
    }
  });

  it('scrolls validation summary clicks inside the owning form only', async () => {
    const hostFixture = TestBed.createComponent(TwoFormHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    const forms = hostFixture.debugElement
      .queryAll(By.directive(FormInput))
      .map((debugElement) => debugElement.componentInstance as FormInput);
    const fieldHosts = Array.from(
      hostFixture.nativeElement.querySelectorAll('[data-field-path="name"]'),
    ) as HTMLElement[];
    const [firstField, secondField] = fieldHosts;

    firstField.scrollIntoView = vi.fn();
    firstField.focus = vi.fn();
    secondField.scrollIntoView = vi.fn();
    secondField.focus = vi.fn();

    forms[0].onSubmit();
    forms[1].onSubmit();
    hostFixture.detectChanges();

    forms[0].onSummaryItemClick(forms[0].validationSummaryItems()[0]);

    expect(firstField.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    expect(firstField.focus).toHaveBeenCalled();
    expect(secondField.scrollIntoView).not.toHaveBeenCalled();
    expect(secondField.focus).not.toHaveBeenCalled();
  });

  it('auto-generates practical sections for legacy configs without sections', () => {
    applyConfig(
      {
        fields: [
          { type: 'text', name: 'name', label: 'Name' },
          { type: 'textarea', name: 'description', label: 'Description' },
          { type: 'json', name: 'payload', label: 'Payload' },
        ],
      },
      {
        name: 'Legacy config',
        description: 'Long operator note',
        payload: '{}',
      },
    );

    expect(component.renderSections().map((section) => section.id)).toEqual([
      'general',
      'details',
      'configuration',
    ]);
    expect(fixture.nativeElement.querySelectorAll('app-form-section-card').length).toBe(3);
  });

  function applyConfig(
    config: FormConfig,
    initialValue: unknown,
    context: FormContext = { user: null },
  ): void {
    fixture.destroy();
    fixture = TestBed.createComponent(FormInput);
    component = fixture.componentInstance;
    component.config = config;
    component.context = context;
    component.initialValue = initialValue;
    component.ngOnChanges({
      config: {
        currentValue: config,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();
  }
});

describe('FormInput Integration with HostComponent', () => {
  let hostFixture: ComponentFixture<FormInputHostComponent>;
  let hostComponent: FormInputHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHostTestModule, SharedModule],

      providers: provideSharedTesting(),
    }).compileComponents();

    hostFixture = TestBed.createComponent(FormInputHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('projects exactly one action bar and handles cancel/submit through real Angular host projection', () => {
    const saveBtns = hostFixture.nativeElement.querySelectorAll('[data-testid="save-btn"]');
    const cancelBtns = hostFixture.nativeElement.querySelectorAll('[data-testid="cancel-btn"]');

    expect(saveBtns.length).toBe(1);
    expect(cancelBtns.length).toBe(1);

    const cancelBtn = cancelBtns[0] as HTMLButtonElement;
    cancelBtn.click();
    expect(hostComponent.cancelSpy).toHaveBeenCalledTimes(1);

    const formInputDebug = hostFixture.debugElement.query(By.directive(FormInput));
    const formInput = formInputDebug.componentInstance as FormInput;

    const saveBtn = saveBtns[0] as HTMLButtonElement;
    saveBtn.click();
    expect(hostComponent.submitSpy).not.toHaveBeenCalled();

    formInput.engine()?.fields[0].setValue('Valid Title');
    hostFixture.detectChanges();

    saveBtn.click();
    expect(hostComponent.submitSpy).toHaveBeenCalledWith({ title: 'Valid Title' });
    expect(hostComponent.submitSpy).toHaveBeenCalledTimes(1);

    hostComponent.submitSpy.mockClear();
    hostComponent.submitting = true;
    hostFixture.detectChanges();

    saveBtn.click();
    expect(hostComponent.submitSpy).not.toHaveBeenCalled();

    hostComponent.submitting = false;
    hostComponent.loading = true;
    hostFixture.detectChanges();

    saveBtn.click();
    expect(hostComponent.submitSpy).not.toHaveBeenCalled();
  });
});
