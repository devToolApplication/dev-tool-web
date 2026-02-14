import { signal, computed } from '@angular/core';
import { ExpressionEngine } from './expression.engine';
import {
  GroupFieldConfig,
  GroupFieldState,
  FormContext,
  FieldState
} from '../models/form-config.model';
import { createFieldState } from './field-state';
import { createArrayFieldState } from './array-field-state';
import { createArrayState } from './array-state';

export function createFieldGroupState<TFormModel extends object>(
  path: string,
  config: GroupFieldConfig,
  modelSignal: any,
  contextSignal: any,
  expr: ExpressionEngine,
  arrays: Record<string, any>
): GroupFieldState {

  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);

  const children: FieldState[] = config.children.map((child) => {

    const childPath = `${path}.${child.name}`;

    if (child.type === 'group') {
      return createFieldGroupState(
        childPath,
        child,
        modelSignal,
        contextSignal,
        expr,
        arrays
      );
    }

    if (child.type === 'array') {
      const arrayState = createArrayState(childPath, modelSignal);
      arrays[childPath] = arrayState;

      return createArrayFieldState(
        childPath,
        child,
        modelSignal,
        contextSignal,
        expr,
        arrayState
      );
    }

    return createFieldState(
      childPath,
      child,
      modelSignal,
      contextSignal,
      expr,
      config.name
    );
  });

  const visible = computed(() => true);
  const disabled = computed(() => false);
  const value = computed(() => null);
  const options = computed(() => []);
  const errors = computed(() => null);
  const valid = computed(() =>
    children.every(c => c.valid())
  );

  function setValue(_: unknown) {}
  function markAsTouched() {
    touched.set(true);
    children.forEach(c => c.markAsTouched());
  }

  function markAsFocused() { focusing.set(true); }
  function markAsBlurred() { blurred.set(true); }

  return {
    type: 'group',
    name: config.name,
    label: config.label,
    path,
    width: config.width,
    fieldConfig: config,

    children,

    touched,
    focusing,
    blurred,
    dirty,

    visible,
    disabled,

    value,
    setValue,

    options,
    errors,
    valid,

    markAsTouched,
    markAsFocused,
    markAsBlurred
  };
}
