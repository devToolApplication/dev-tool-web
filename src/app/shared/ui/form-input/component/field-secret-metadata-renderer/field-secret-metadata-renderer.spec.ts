import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../../shared.module';
import { provideSharedTesting } from '../../../../testing/shared-test.providers';
import { FieldState } from '../../models/form-config.model';
import { FieldSecretMetadataRendererComponent } from './field-secret-metadata-renderer';

describe('FieldSecretMetadataRendererComponent', () => {
  let component: FieldSecretMetadataRendererComponent;
  let fixture: ComponentFixture<FieldSecretMetadataRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
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
});

function createField(model: WritableSignal<unknown[]>): FieldState {
  return {
    fieldConfig: {
      type: 'secret-metadata',
      name: 'metadata',
      label: 'secretMetadata',
      options: [{ label: 'Password', value: 'secret-password' }]
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
    visible: signal(true),
    disabled: signal(false),
    options: signal([{ label: 'Password', value: 'secret-password' }]),
    errors: signal(null),
    valid: signal(true),
    markAsTouched: () => undefined,
    markAsFocused: () => undefined,
    markAsBlurred: () => undefined
  };
}
