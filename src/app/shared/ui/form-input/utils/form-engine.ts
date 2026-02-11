import { signal, computed } from '@angular/core';
import { createFieldState } from './field-state';
import { createArrayState } from './array-state';
import { ExpressionEngine } from './expression.engine';

export function createFormEngine(
  config: any,
  context: any,
  initialValue: any = {}
) {

  const model = signal(initialValue);
  const ctxSignal = signal(context);
  const expr = new ExpressionEngine();

  const fields: any[] = [];
  const arrays: any = {};

  function process(list: any[], parentPath = '') {

    list.forEach(field => {

      const path = parentPath
        ? `${parentPath}.${field.name}`
        : field.name;

      if (field.type === 'group') {
        process(field.children, path);
      }

      else if (field.type === 'array') {
        arrays[path] = createArrayState(path, model);
      }

      else {
        fields.push(
          createFieldState(
            path,
            field,
            model,
            ctxSignal,
            expr
          )
        );
      }
    });
  }

  process(config.fields);

  const valid = computed(() =>
    fields.every(f => f.valid())
  );

  function markAllAsTouched() {
    fields.forEach(f => f.markAsTouched());
  }

  function reset(value: any = {}) {
    model.set(value);
    fields.forEach(f => f.touched.set(false));
  }

  function patchValue(value: any) {
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
