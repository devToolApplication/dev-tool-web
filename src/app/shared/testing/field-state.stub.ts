import { signal } from '@angular/core';

import { ArrayFieldState, FieldConfig, FieldState, GroupFieldState, SelectOption } from '../ui/form-input/models/form-config.model';

export function createFieldState(config: FieldConfig, initialValue: unknown = ''): FieldState {
  const value = signal(initialValue);
  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);

  return {
    fieldConfig: config,
    type: config.type,
    name: config.name,
    label: config.label,
    path: config.name,
    width: config.width,
    value,
    setValue: (nextValue: unknown) => {
      value.set(nextValue);
      dirty.set(true);
    },
    touched,
    focusing,
    blurred,
    dirty,
    visible: signal(true),
    disabled: signal(false),
    options: signal<SelectOption[]>([]),
    errors: signal<Record<string, string> | null>(null),
    valid: signal(true),
    markAsTouched: () => touched.set(true),
    markAsFocused: () => focusing.set(true),
    markAsBlurred: () => blurred.set(true)
  };
}

export function createArrayFieldState(): ArrayFieldState {
  return {
    ...createFieldState({ type: 'array', name: 'items', label: 'name', itemConfig: [] }, []),
    type: 'array',
    fieldConfig: { type: 'array', name: 'items', label: 'name', itemConfig: [] },
    children: signal<FieldState[][]>([]),
    arrayState: {
      addItem: () => undefined,
      removeItem: () => undefined
    }
  };
}

export function createGroupFieldState(): GroupFieldState {
  return {
    ...createFieldState({ type: 'group', name: 'group', label: 'general', children: [] }),
    type: 'group',
    fieldConfig: { type: 'group', name: 'group', label: 'general', children: [] },
    children: []
  };
}
