import { signal, computed } from '@angular/core';
import { updateByPath, getByPath } from './model.utils';
import { ExpressionEngine } from './expression.engine';

export function createFieldState(
  path: string,
  config: any,
  modelSignal: any,
  contextSignal: any,
  expr: ExpressionEngine
) {

  const touched = signal(false);
  const dirty = signal(false);

  const value = computed(() =>
    getByPath(modelSignal(), path)
  );

  function setValue(val: any) {

    if (config.type === 'number') {
      val = val !== null ? Number(val) : null;
    }

    modelSignal.update((m: any) =>
      updateByPath(m, path, val)
    );

    dirty.set(true);
  }


  const visible = computed(() => {
    if (!config.rules?.visible) return true;

    return expr.evaluate(config.rules.visible, {
      model: modelSignal(),
      user: contextSignal().user,
      extra: contextSignal().extra,
      mode: contextSignal().mode,
      value: value()
    });
  });

  const disabled = computed(() => {
    if (!config.rules?.disabled) return false;

    return expr.evaluate(config.rules.disabled, {
      model: modelSignal(),
      user: contextSignal().user,
      extra: contextSignal().extra,
      mode: contextSignal().mode,
      value: value()
    });
  });

  const options = computed(() => {
    if (config.type !== 'select') return null;

    const ctx = {
      model: modelSignal(),
      user: contextSignal().user,
      extra: contextSignal().extra,
      mode: contextSignal().mode,
      value: value()
    };

    if (config.optionsExpression) {
      return expr.evaluate(config.optionsExpression, ctx) || [];
    }

    return config.options || [];
  });

  const errors = computed(() => {

    const ctx = {
      model: modelSignal(),
      user: contextSignal().user,
      extra: contextSignal().extra,
      mode: contextSignal().mode,
      value: value()
    };

    const result: any = {};

    config.validation?.forEach((rule: any) => {
      const invalid = expr.evaluate(rule.expression, ctx);

      if (invalid) {
        result.custom =
          expr.renderTemplate(rule.message, ctx);
      }
    });

    return Object.keys(result).length ? result : null;
  });

  const valid = computed(() => !errors());

  return {
    path,
    value,        // signal readonly
    setValue,     // 👈 dùng cái này để set
    touched,
    dirty,
    visible,
    disabled,
    options,
    errors,
    valid,
    markAsTouched: () => touched.set(true)
  };
}
