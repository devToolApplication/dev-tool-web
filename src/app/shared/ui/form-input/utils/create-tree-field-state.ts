import { computed, signal } from '@angular/core';
import { ExpressionEngine } from './expression.engine';
import {
  ArrayFieldState,
  ArrayState,
  FieldState,
  TreeFieldConfig,
  TreeFieldState
} from '../models/form-config.model';
import { createNestedFieldState } from './create-nested-field-state';

export function createFieldTreeState<TFormModel extends object>(
  path: string,
  config: TreeFieldConfig,
  modelSignal: any,
  contextSignal: any,
  expr: ExpressionEngine,
  arrays: Record<string, ArrayState>,
  treeTemplate?: TreeFieldConfig
): TreeFieldState {
  const resolvedConfig: TreeFieldConfig = config.children?.length
    ? config
    : {
        ...config,
        children: treeTemplate?.children ?? []
      };

  const touched = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const dirty = signal(false);

  const children: Array<FieldState | ArrayFieldState> = (resolvedConfig.children ?? []).map((child) =>
    createNestedFieldState(
      `${path}.${child.name}`,
      child,
      modelSignal,
      contextSignal,
      expr,
      arrays,
      resolvedConfig.name,
      resolvedConfig
    )
  );

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: null
  });

  const visible = computed(() => {
    if (!resolvedConfig.rules?.visible) return true;
    return !!expr.evaluate(resolvedConfig.rules.visible, buildCtx());
  });

  const disabled = computed(() => {
    if (!resolvedConfig.rules?.disabled) return false;
    return !!expr.evaluate(resolvedConfig.rules.disabled, buildCtx());
  });

  return {
    type: 'tree',
    name: resolvedConfig.name,
    label: resolvedConfig.label,
    path,
    width: resolvedConfig.width,
    fieldConfig: resolvedConfig,
    children,
    touched,
    focusing,
    blurred,
    dirty,
    visible,
    disabled,
    value: computed(() => null),
    setValue: () => {},
    options: computed(() => []),
    errors: computed(() => null),
    valid: computed(() => children.every((child) => child.valid())),
    markAsTouched() {
      touched.set(true);
      children.forEach((child) => child.markAsTouched());
    },
    markAsFocused() {
      focusing.set(true);
    },
    markAsBlurred() {
      blurred.set(true);
    }
  };
}
