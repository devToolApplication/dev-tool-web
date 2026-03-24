import { signal, computed } from '@angular/core';
import { ExpressionEngine } from './expression.engine';
import {
  GroupFieldConfig,
  GroupFieldState,
  FieldState,
  ArrayFieldState,
  ArrayState,
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
  treeTemplate?: TreeFieldConfig
): GroupFieldState {

  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);

  const children: Array<FieldState | ArrayFieldState> = config.children.map((child) =>
    createNestedFieldState(
      `${path}.${child.name}`,
      child,
      modelSignal,
      contextSignal,
      expr,
      arrays,
      config.name,
      treeTemplate
    )
  );

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: null
  });

  const visible = computed(() => {
    if (!config.rules?.visible) return true;
    return !!expr.evaluate(config.rules.visible, buildCtx());
  });

  const disabled = computed(() => {
    if (!config.rules?.disabled) return false;
    return !!expr.evaluate(config.rules.disabled, buildCtx());
  });
  const value = computed(() => null);
  const options = computed(() => []);
  const errors = computed(() => null);
  const valid = computed(() => {
    if (!visible()) {
      return true;
    }

    return children.every(c => c.valid());
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
