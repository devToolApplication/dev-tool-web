import { signal } from '@angular/core';

import { FieldState } from '../../models/form-config.model';
import { FieldRecordRenderer } from './field-record-renderer';

describe('FieldRecordRenderer', () => {
  let component: FieldRecordRenderer;

  const createField = (initial: Record<string, string> = {}): FieldState => {
    const valueSignal = signal(initial);

    return {
      fieldConfig: { type: 'record', name: 'record' },
      type: 'record',
      name: 'record',
      path: 'record',
      value: valueSignal,
      setValue: (val: Record<string, string>) => valueSignal.set(val),
      touched: signal(false),
      focusing: signal(false),
      blurred: signal(false),
      dirty: signal(false),
      visible: signal(true),
      disabled: signal(false),
      options: signal([]),
      errors: signal(null),
      valid: signal(true),
      markAsTouched: () => undefined,
      markAsFocused: () => undefined,
      markAsBlurred: () => undefined
    };
  };

  beforeEach(() => {
    component = new FieldRecordRenderer();
    component.field = createField({ language: 'TypeScript' });
  });

  it('should expose current record entries', () => {
    expect(component.recordEntries).toEqual([{ key: 'language', value: 'TypeScript' }]);
  });

  it('should add a new empty row', () => {
    component.onRecordAdd();

    expect(component.field.value()).toEqual({
      language: 'TypeScript',
      '': ''
    });
  });

  it('should fallback to generated key when key is blank', () => {
    component.onRecordKeyChange(0, '');
    component.onRecordValueChange(0, 'Angular');

    expect(component.field.value()).toEqual({ key_1: 'Angular' });
  });
});
