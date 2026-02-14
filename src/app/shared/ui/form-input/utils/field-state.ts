import { signal, computed, WritableSignal } from '@angular/core';
import { updateByPath, getByPath } from './form.utils';
import { ExpressionEngine } from './expression.engine';
import {
  FieldConfig,
  FieldState,
  FormContext,
  SelectOption,
  GroupFieldState
} from '../models/form-config.model';

export function createFieldState<TFormModel extends object>(
  path: string,
  config: FieldConfig,
  modelSignal: WritableSignal<TFormModel>,
  contextSignal: WritableSignal<FormContext>,
  expr: ExpressionEngine,
  groupName?: string
): FieldState {

  const { type, name, label, width } = config;

  const touched = signal(false);
  const dirty = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);

  const value = computed(() =>
    getByPath(modelSignal(), path)
  );

  function setValue(val: unknown): void {
    modelSignal.update((m: TFormModel) =>
      updateByPath(m, path, val)
    );
    dirty.set(true);
  }

  function markAsTouched() { touched.set(true); }
  function markAsFocused() { focusing.set(true); blurred.set(false); }
  function markAsBlurred() { focusing.set(false); blurred.set(true); }

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: value()
  });

  const visible = computed(() => {
    if (!config.rules?.visible) return true;
    return !!expr.evaluate(config.rules.visible, buildCtx());
  });

  const disabled = computed(() => {
    if (!config.rules?.disabled) return false;
    return !!expr.evaluate(config.rules.disabled, buildCtx());
  });

  const options = computed<SelectOption[]>(() => {
    if (
      config.type !== 'select' &&
      config.type !== 'select-multi' &&
      config.type !== 'radio'
    ) return [];

    if ('optionsExpression' in config && config.optionsExpression) {
      return expr.evaluate(config.optionsExpression, buildCtx()) || [];
    }

    return (config as any).options || [];
  });

  const errors = computed<Record<string, string> | null>(() => {
    const result: Record<string, string> = {};

    config.validation?.forEach(rule => {
      const invalid = expr.evaluate(rule.expression, buildCtx());
      if (invalid) {
        result["custom"] = expr.renderTemplate(rule.message, buildCtx());
      }
    });

    return Object.keys(result).length ? result : null;
  });

  const valid = computed(() => !errors());

  const baseState: FieldState = {
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
    markAsBlurred,
    groupName
  };

  if (config.type === 'group') {

    const children = config.children.map(child =>
      createFieldState(
        `${path}.${child.name}`,
        child,
        modelSignal,
        contextSignal,
        expr,
        config.name
      )
    );

    return {
      ...baseState,
      fieldConfig: config,
      children
    } as GroupFieldState;
  }

  return baseState;
}
