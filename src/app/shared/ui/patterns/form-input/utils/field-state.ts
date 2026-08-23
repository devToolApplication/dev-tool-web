import type { WritableSignal } from '@angular/core';
import { signal, computed } from '@angular/core';
import {
  getByPath,
  isEmptyFormValue,
  isRequiredByConfig,
  requiredMessage,
  resolveDisabledExpression,
  resolveVisibleExpression,
  updateByPath,
} from './form.utils';
import type { ExpressionEngine } from './expression.engine';
import type {
  FieldConfig,
  FieldState,
  FormCustomValidator,
  FormContext,
  SelectOption,
  GroupFieldState,
  TextFieldConfig,
} from '../models/form-config.model';
import { formValidationHelpers } from './expression.engine';

export function createFieldState<TFormModel extends object>(
  path: string,
  config: FieldConfig,
  modelSignal: WritableSignal<TFormModel>,
  contextSignal: WritableSignal<FormContext>,
  expr: ExpressionEngine,
  groupName?: string,
  validators: Record<string, FormCustomValidator> = {},
): FieldState {
  const { type, name, label, width } = config;

  const touched = signal(false);
  const dirty = signal(false);
  const focusing = signal(false);
  const blurred = signal(false);
  const externalErrors = signal<Record<string, string> | null>(null);

  const value = computed(() => getByPath(modelSignal(), path));

  function setValue(val: unknown): void {
    modelSignal.update((m: TFormModel) => updateByPath(m, path, val));
    dirty.set(true);
    externalErrors.set(null);
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

  const buildCtx = () => ({
    model: modelSignal(),
    context: contextSignal(),
    value: value(),
  });

  const visible = computed(() => {
    const expression = resolveVisibleExpression(config);
    if (!expression) return true;
    return !!expr.evaluate(expression, buildCtx());
  });

  const disabled = computed(() => {
    if (contextSignal().mode === 'view') {
      return true;
    }
    const expression = resolveDisabledExpression(config);
    if (!expression) return false;
    return !!expr.evaluate(expression, buildCtx());
  });

  const required = computed(() => visible() && isRequiredByConfig(config, expr, buildCtx()));

  const options = computed<SelectOption[]>(() => {
    if (
      config.type !== 'select' &&
      config.type !== 'select-multi' &&
      config.type !== 'multi-select' &&
      config.type !== 'auto-complete' &&
      config.type !== 'autocomplete' &&
      config.type !== 'input-multi' &&
      config.type !== 'radio' &&
      config.type !== 'tags'
    )
      return [];

    if ('optionsExpression' in config && config.optionsExpression) {
      return normalizeSelectOptions(expr.evaluate(config.optionsExpression, buildCtx()));
    }

    return 'options' in config ? (config.options ?? []) : [];
  });

  const errors = computed<Record<string, string> | null>(() => {
    if (!visible()) {
      return null;
    }

    const result: Record<string, string> = { ...(externalErrors() ?? {}) };
    const currentValue = value();

    if (isJsonContent(config)) {
      const rawValue = String(currentValue ?? '').trim();
      if (rawValue !== '') {
        try {
          JSON.parse(rawValue);
        } catch {
          result['custom'] = config.jsonValidationMessage ?? 'shared.json.invalid';
        }
      }
    }

    if (required() && isEmptyFormValue(currentValue)) {
      result['error-required'] = requiredMessage(config);
    }

    config.validation?.forEach((rule, index) => {
      if (rule.type === 'required') {
        return;
      }

      if (rule.type === 'custom' && rule.validator) {
        const validator = validators[rule.validator];
        const validationResult = validator?.(currentValue, {
          formValue: modelSignal() as Record<string, unknown>,
          fieldKey: path,
          helpers: formValidationHelpers,
        });
        if (validationResult && validationResult !== true) {
          validationResult.forEach((error, errorIndex) => {
            result[`custom-${index}-${errorIndex}`] = error.message;
          });
        }
        return;
      }

      const invalid = evaluateRule(rule, currentValue, buildCtx(), expr);
      if (invalid) {
        const key = `${rule.severity === 'warning' ? 'warning' : 'error'}-${rule.type ?? 'expression'}-${index}`;
        result[key] = expr.renderTemplate(rule.message, buildCtx());
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
    externalErrors,
    visible,
    disabled,
    required,
    options,
    errors,
    valid,
    markAsTouched,
    markAsFocused,
    markAsBlurred,
    groupName,
  };

  if (config.type === 'group') {
    const children = config.children.map((child) =>
      createFieldState(
        `${path}.${child.name}`,
        child,
        modelSignal,
        contextSignal,
        expr,
        config.name,
        validators,
      ),
    );

    return {
      ...baseState,
      fieldConfig: config,
      children,
    } as GroupFieldState;
  }

  return baseState;
}

function isJsonContent(config: FieldConfig): config is TextFieldConfig {
  return (
    config.type === 'json' ||
    ((config.type === 'text' || config.type === 'textarea') && config.contentType === 'json')
  );
}

function evaluateRule(
  rule: NonNullable<FieldConfig['validation']>[number],
  value: unknown,
  ctx: { model: unknown; context: unknown; value?: unknown },
  expr: ExpressionEngine,
): boolean {
  if (rule.type === 'expression' || rule.expression) {
    return !!expr.evaluate(rule.expression ?? 'false', ctx);
  }

  switch (rule.type) {
    case 'required':
      return isEmptyValue(value);
    case 'min':
      return (
        value !== null && value !== undefined && value !== '' && Number(value) < Number(rule.value)
      );
    case 'max':
      return (
        value !== null && value !== undefined && value !== '' && Number(value) > Number(rule.value)
      );
    case 'regex':
      return (
        typeof rule.value === 'string' &&
        !isEmptyValue(value) &&
        !new RegExp(rule.value).test(String(value))
      );
    default:
      return false;
  }
}

function isEmptyValue(value: unknown): boolean {
  return isEmptyFormValue(value);
}

function normalizeSelectOptions(value: unknown): SelectOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is SelectOption =>
      !!item && typeof item === 'object' && 'label' in item && 'value' in item,
  );
}
