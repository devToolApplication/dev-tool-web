import { signal } from '@angular/core';

import type {
  ArrayFieldState,
  FieldConfig,
  FieldState,
  GroupFieldState,
  SelectOption,
} from '@shared/ui/patterns/form-input/models/form-config.model';

export function createFieldState(config: FieldConfig, initialValue: unknown = ''): FieldState {
  const value = signal(initialValue);
  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);
  const externalErrors = signal<Record<string, string> | null>(null);

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
    externalErrors,
    visible: signal(true),
    disabled: signal(false),
    required: signal(
      config.required === true ||
        config.validation?.some((rule) => rule.type === 'required') === true,
    ),
    options: signal<SelectOption[]>([]),
    errors: signal<Record<string, string> | null>(null),
    valid: signal(true),
    markAsTouched: () => touched.set(true),
    markAsFocused: () => focusing.set(true),
    markAsBlurred: () => blurred.set(true),
  };
}

export function createArrayFieldState(): ArrayFieldState {
  const baseState = createFieldState(
    { type: 'array', name: 'items', label: 'name', itemConfig: [] },
    [],
  );
  const value = signal<unknown[]>([]);

  return {
    ...baseState,
    type: 'array',
    fieldConfig: { type: 'array', name: 'items', label: 'name', itemConfig: [] },
    value,
    setValue: (nextValue: unknown[]) => value.set(nextValue),
    children: signal<FieldState[][]>([]),
    arrayState: {
      addItem: () => undefined,
      removeItem: () => undefined,
      moveItem: () => undefined,
    },
  };
}

export function createGroupFieldState(): GroupFieldState {
  return {
    ...createFieldState({ type: 'group', name: 'group', label: 'general', children: [] }),
    type: 'group',
    fieldConfig: { type: 'group', name: 'group', label: 'general', children: [] },
    children: [],
  };
}
