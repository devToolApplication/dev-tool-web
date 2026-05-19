import { computed, signal } from '@angular/core';
import { ExpressionEngine } from './expression.engine';
import {
  getByPath,
  isEmptyFormValue,
  isRequiredByConfig,
  requiredMessage,
  resolveDisabledExpression,
  resolveVisibleExpression,
  updateByPath
} from './form.utils';
import {
  ArrayFieldState,
  ArrayState,
  FieldState,
  FormCustomValidator,
  TreeFieldConfig,
  TreeFieldState
} from '../models/form-config.model';
import { createNestedFieldState } from './create-nested-field-state';
import { formValidationHelpers } from './expression.engine';

export function createFieldTreeState<TFormModel extends object>(
  path: string,
  config: TreeFieldConfig,
  modelSignal: any,
  contextSignal: any,
  expr: ExpressionEngine,
  arrays: Record<string, ArrayState>,
  treeTemplate?: TreeFieldConfig,
  validators: Record<string, FormCustomValidator> = {}
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
  const externalErrors = signal<Record<string, string> | null>(null);
  const value = computed(() => getByPath(modelSignal(), path));

  function setValue(val: unknown): void {
    modelSignal.update((m: TFormModel) => updateByPath(m, path, val));
    dirty.set(true);
    externalErrors.set(null);
  }

  const children: Array<FieldState | ArrayFieldState> = (resolvedConfig.children ?? []).map((child) =>
    createNestedFieldState(
      `${path}.${child.name}`,
      child,
      modelSignal,
      contextSignal,
      expr,
      arrays,
      resolvedConfig.name,
      resolvedConfig,
      validators
    )
  );

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: value()
  });

  const visible = computed(() => {
    const expression = resolveVisibleExpression(resolvedConfig);
    if (!expression) return true;
    return !!expr.evaluate(expression, buildCtx());
  });

  const disabled = computed(() => {
    if (contextSignal().mode === 'view') {
      return true;
    }
    const expression = resolveDisabledExpression(resolvedConfig);
    if (!expression) return false;
    return !!expr.evaluate(expression, buildCtx());
  });

  const required = computed(() => visible() && isRequiredByConfig(resolvedConfig, expr, buildCtx()));

  const errors = computed<Record<string, string> | null>(() => {
    if (!visible()) {
      return null;
    }

    const result: Record<string, string> = { ...(externalErrors() ?? {}) };
    if (required() && isEmptyFormValue(value())) {
      result['error-required'] = requiredMessage(resolvedConfig);
    }

    resolvedConfig.validation?.forEach((rule, index) => {
      if (rule.type === 'required') {
        return;
      }

      if (rule.type === 'custom' && rule.validator) {
        const validator = validators[rule.validator];
        const validationResult = validator?.(value(), {
          formValue: modelSignal() as Record<string, unknown>,
          fieldKey: path,
          helpers: formValidationHelpers
        });
        if (validationResult && validationResult !== true) {
          validationResult.forEach((error, errorIndex) => {
            const key = error.nodeId
              ? `node:${error.nodeId}:custom-${index}-${errorIndex}`
              : `custom-${index}-${errorIndex}`;
            result[key] = error.message;
          });
        }
        return;
      }

      const invalid = evaluateTreeRule(rule, value(), buildCtx(), expr);
      if (invalid) {
        const key = `${rule.severity === 'warning' ? 'warning' : 'error'}-${rule.type ?? 'expression'}-${index}`;
        result[key] = expr.renderTemplate(rule.message, buildCtx());
      }
    });

    return Object.keys(result).length ? result : null;
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
    externalErrors,
    visible,
    disabled,
    required,
    value,
    setValue,
    options: computed(() => []),
    errors,
    valid: computed(() => {
      if (!visible()) {
        return true;
      }

      return !errors() && children.every((child) => child.valid());
    }),
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

function evaluateTreeRule(
  rule: NonNullable<TreeFieldConfig['validation']>[number],
  value: unknown,
  ctx: { model: unknown; context: unknown; value?: unknown },
  expr: ExpressionEngine
): boolean {
  if (rule.type === 'expression' || rule.expression) {
    return !!expr.evaluate(rule.expression ?? 'false', ctx);
  }

  switch (rule.type) {
    case 'required':
      return !Array.isArray(value) || value.length === 0;
    case 'min':
      return formValidationHelpers.countTreeNodes(value) < Number(rule.value);
    case 'max':
      return formValidationHelpers.countTreeNodes(value) > Number(rule.value);
    case 'regex':
      return typeof rule.value === 'string' && !new RegExp(rule.value).test(JSON.stringify(value ?? []));
    default:
      return false;
  }
}
