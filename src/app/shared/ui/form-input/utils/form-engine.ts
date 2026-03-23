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
            arrays
          )
        );

        return;
      }

      fields.push(createNestedFieldState(path, field, model, ctxSignal, expr, arrays, groupName));

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
    fields.forEach(f => f.touched.set(false));
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
