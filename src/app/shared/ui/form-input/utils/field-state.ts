import { signal, computed, WritableSignal } from '@angular/core';
import { updateByPath, getByPath } from './model.utils';
import { ExpressionEngine } from './expression.engine';
import {FieldConfig, FieldState, FormContext, SelectOption} from '../models/form-config.model';

export function createFieldState<TModel extends object>(
  path: string,
  config: FieldConfig,
  modelSignal: WritableSignal<TModel>,
  contextSignal: WritableSignal<FormContext>,
  expr: ExpressionEngine
): FieldState<TModel> {
  const { type, name, label, width, ...rest } = config;

  const touched = signal(false);
  const dirty = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);

  const value = computed(() =>
    getByPath(modelSignal(), path)
  );

  function setValue(val: unknown): void {
    modelSignal.update((m: TModel) =>
      updateByPath(m, path, val)
    );

    dirty.set(true);
  }

  const visible = computed(() => {
    if (!config.rules?.visible) return true;

    return !!expr.evaluate(config.rules.visible, {
      ...contextSignal(),
      model: modelSignal(),
      value: value()
    });
  });

  const disabled = computed(() => {
    if (!config.rules?.disabled) return false;

    return !!expr.evaluate(config.rules.disabled, {
      ...contextSignal(),
      model: modelSignal(),
      value: value()
    });
  });

  const options = computed<SelectOption[] | null>(() => {
    if (config.type !== 'select') return null;

    const ctx = {
      ...contextSignal(),
      model: modelSignal(),
      value: value()
    };

    if ('optionsExpression' in config && config.optionsExpression) {
      return expr.evaluate(config.optionsExpression, ctx) || [];
    }

    return (config as any).options || [];
  });

  const errors = computed<Record<string, string> | null>(() => {

    const ctx = {
      ...contextSignal(),
      model: modelSignal(),
      value: value()
    };

    const result: Record<string, string> = {};

    config.validation?.forEach(rule => {
      const invalid = expr.evaluate(rule.expression, ctx);

      if (invalid) {
        result["custom"] =
          expr.renderTemplate(rule.message, ctx);
      }
    });

    return Object.keys(result).length ? result : null;
  });

  const valid = computed(() => !errors());

  return {
    type,
    name,
    label,
    path,
    width,
    value,
    setValue,
    touched,
    dirty,
    focusing,
    blurred,
    visible,
    disabled,
    options,
    errors,
    valid,
    ...rest
  } as FieldState;
}
