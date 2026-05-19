import { signal, computed } from '@angular/core';
import { ExpressionEngine } from './expression.engine';
import {
  isRequiredByConfig,
  resolveDisabledExpression,
  resolveVisibleExpression
} from './form.utils';
import {
  GroupFieldConfig,
  GroupFieldState,
  FieldState,
  ArrayFieldState,
  ArrayState,
  FormCustomValidator,
  TreeFieldConfig
} from '../models/form-config.model';
import { createNestedFieldState } from './create-nested-field-state';

export function createFieldGroupState<TFormModel extends object>(
  path: string,
  config: GroupFieldConfig,
  modelSignal: any,
  contextSignal: any,
  expr: ExpressionEngine,
  arrays: Record<string, ArrayState>,
  treeTemplate?: TreeFieldConfig,
  validators: Record<string, FormCustomValidator> = {}
): GroupFieldState {

  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);
  const externalErrors = signal<Record<string, string> | null>(null);

  const children: Array<FieldState | ArrayFieldState> = config.children.map((child) => {
    const childPath = config.flat ? child.name : `${path}.${child.name}`;
    return createNestedFieldState(
      childPath,
      child,
      modelSignal,
      contextSignal,
      expr,
      arrays,
      config.name,
      treeTemplate,
      validators
    );
  });

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: null
  });

  const visible = computed(() => {
    const expression = resolveVisibleExpression(config);
    if (!expression) return true;
    return !!expr.evaluate(expression, buildCtx());
  });

  const disabled = computed(() => {
    const expression = resolveDisabledExpression(config);
    if (!expression) return false;
    return !!expr.evaluate(expression, buildCtx());
  });
  const required = computed(() => visible() && isRequiredByConfig(config, expr, buildCtx()));
  const value = computed(() => null);
  const options = computed(() => []);
  const errors = computed(() => externalErrors());
  const valid = computed(() => {
    if (!visible()) {
      return true;
    }

    return !errors() && children.every(c => c.valid());
  });

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
    externalErrors,

    visible,
    disabled,
    required,

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
