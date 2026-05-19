import { signal, computed, WritableSignal } from '@angular/core';
import { createArrayState } from './array-state';
import { createArrayFieldState } from './array-field-state';
import { ExpressionEngine } from './expression.engine';

import {
  ArrayState,
  FieldConfig,
  FieldState,
  ArrayFieldState,
  FormConfig,
  FormContext
} from '../models/form-config.model';
import { createNestedFieldState } from './create-nested-field-state';

export function createFormEngine<TModel extends object>(
  config: FormConfig,
  context: FormContext,
  initialValue: TModel
) {

  const model: WritableSignal<TModel> = signal(initialValue);
  const ctxSignal: WritableSignal<FormContext> = signal(context);
  const expr = new ExpressionEngine();

  const fields: (FieldState | ArrayFieldState<TModel>)[] = [];
  const arrays: Record<string, ArrayState> = {};

  function process(list: FieldConfig[], parentPath = '', groupName ?: string) {

    list.forEach(field => {

      const path = parentPath
        ? `${parentPath}.${field.name}`
        : field.name;

      if (field.type === 'array') {

        const arrayState = createArrayState(path, model);
        arrays[path] = arrayState;

        fields.push(
          createArrayFieldState(
            path,
            field,
            model,
            ctxSignal,
            expr,
            arrayState,
            arrays,
            undefined,
            config.validators ?? {}
          )
        );

        return;
      }

      fields.push(createNestedFieldState(path, field, model, ctxSignal, expr, arrays, groupName, undefined, config.validators ?? {}));

    });
  }

  process(config.fields);

  const valid = computed(() =>
    fields.every(f => f.valid())
  );

  function markAllAsTouched() {
    fields.forEach(f => f.markAsTouched());
  }

  function reset(value: TModel) {
    model.set(value);
    fields.forEach(resetFieldState);
  }

  function patchValue(value: Partial<TModel>) {
    model.update(m => ({ ...m, ...value }));
  }

  return {
    model,
    fields,
    arrays,
    valid,
    markAllAsTouched,
    reset,
    patchValue,
    context: ctxSignal
  };
}

function resetFieldState(field: FieldState | ArrayFieldState): void {
  field.touched.set(false);
  field.dirty.set(false);
  field.externalErrors.set(null);
  field.focusing.set(false);
  field.blurred.set(false);

  if (!('children' in field)) {
    return;
  }

  const rawChildren = field.children;
  const children = typeof rawChildren === 'function' ? rawChildren() : rawChildren;
  children.flat().forEach((child) => resetFieldState(child));
}
