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

  const { type, name, label, width } = config;

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

  function markAsTouched() {
    touched.set(true);
  }

  function markAsFocused() {
    focusing.set(true);
    blurred.set(false);
  }

  function markAsBlurred() {
    focusing.set(false);
    blurred.set(true);
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

  const options = computed<SelectOption[]>(() => {
    if (config.type !== 'select' 
      && config.type !== 'select-multi' 
      && config.type !== 'radio') return [];

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
    fieldConfig: config,
    type,
    name,
    label,
    path,
    width,
    value,
    setValue,
    touched,
    focusing,
    blurred,
    dirty,
    visible,
    disabled,
    options,
    errors,
    valid,
    markAsTouched,
    markAsFocused,
    markAsBlurred
  };
}

