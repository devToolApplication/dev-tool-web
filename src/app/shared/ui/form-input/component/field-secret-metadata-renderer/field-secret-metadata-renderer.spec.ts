import { SimpleChange, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SharedModule } from '../../../../shared.module';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';
import { FieldState } from '../../models/form-config.model';
import { FORM_INPUT_OPTIONS_LOADERS } from '../../utils/form-input-options-loader';
import { FieldSecretMetadataRendererComponent } from './field-secret-metadata-renderer';

describe('FieldSecretMetadataRendererComponent', () => {
  let component: FieldSecretMetadataRendererComponent;
  let fixture: ComponentFixture<FieldSecretMetadataRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        {
          provide: FORM_INPUT_OPTIONS_LOADERS,
          multi: true,
          useValue: {
            source: 'test-secrets',
            load: () => of([{ label: 'Runtime / Password', value: 'secret-password' }])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldSecretMetadataRendererComponent);
    component = fixture.componentInstance;
  });

  it('builds a basic auth metadata payload', () => {
    const model = signal<unknown[]>([]);
    component.field = createField(model);
    fixture.detectChanges();

    component.updateType(0, 'BASIC_AUTH');
    component.updateKey(0, 'Authorization');
    component.updateConfig(0, 'username', 'svc-user');
    component.updateConfig(0, 'passwordSecretId', 'secret-password');

    expect(model()).toEqual([
      {
        key: 'Authorization',
        type: 'BASIC_AUTH',
        config: {
          username: 'svc-user',
          passwordSecretId: 'secret-password'
        }
      }
    ]);
  });

  it('keeps legacy config metadata editable as raw text', () => {
    const model = signal<unknown[]>([{ key: 'X-Source', type: 'CONFIG', value: 'admin' }]);
    component.field = createField(model);
    fixture.detectChanges();

    expect(component.entries[0]).toEqual({
      key: 'X-Source',
      type: 'RAW_TEXT',
      value: 'admin',
      config: undefined
    });
  });

  it('loads secret options through a generic options source', () => {
    const model = signal<unknown[]>([]);
    component.field = createField(model, { optionsSource: 'test-secrets', options: [] });
    component.ngOnChanges({ field: new SimpleChange(undefined, component.field, true) });
    fixture.detectChanges();

    expect(component.secretOptions).toEqual([{ label: 'Runtime / Password', value: 'secret-password' }]);
  });
});

function createField(
  model: WritableSignal<unknown[]>,
  overrides: Partial<FieldState['fieldConfig']> = {}
): FieldState {
  return {
    fieldConfig: {
      type: 'secret-metadata',
      name: 'metadata',
      label: 'secretMetadata',
      options: [{ label: 'Password', value: 'secret-password' }],
      ...overrides
    },
    type: 'secret-metadata',
    name: 'metadata',
    label: 'secretMetadata',
    path: 'metadata',
    value: model,
    setValue: (value: unknown) => model.set(value as unknown[]),
    touched: signal(false),
    focusing: signal(false),
    blurred: signal(false),
    dirty: signal(false),
    externalErrors: signal(null),
    visible: signal(true),
    disabled: signal(false),
    required: signal(false),
    options: signal([{ label: 'Password', value: 'secret-password' }]),
    errors: signal(null),
    valid: signal(true),
    markAsTouched: () => undefined,
    markAsFocused: () => undefined,
    markAsBlurred: () => undefined
  };
}
