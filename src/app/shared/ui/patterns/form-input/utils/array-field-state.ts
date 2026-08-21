import {
    signal,
    computed,
    WritableSignal,
    Signal
  } from '@angular/core';
  
  import {
    ArrayFieldConfig,
    ArrayFieldState,
    FieldState,
    FormContext,
    FormCustomValidator,
    ArrayState,
    TreeFieldConfig
  } from '../models/form-config.model';
  
  import {
    getByPath,
    isEmptyFormValue,
    isRequiredByConfig,
    requiredMessage,
    resolveDisabledExpression,
    resolveVisibleExpression
  } from './form.utils';
  import { ExpressionEngine, formValidationHelpers } from './expression.engine';
  import { createNestedFieldState } from './create-nested-field-state';
  
  export function createArrayFieldState<TModel extends object>(
    path: string,
    config: ArrayFieldConfig,
    modelSignal: WritableSignal<TModel>,
    contextSignal: WritableSignal<FormContext>,
    expr: ExpressionEngine,
    arrayState: ArrayState,
    arrays: Record<string, ArrayState>,
    treeTemplate?: TreeFieldConfig,
    validators: Record<string, FormCustomValidator> = {}
  ): ArrayFieldState<TModel> {
  
    const touched = signal(false);
    const dirty = signal(false);
    const externalErrors = signal<Record<string, string> | null>(null);
  
    const value = computed(() => {
      const v = getByPath(modelSignal(), path);
      return Array.isArray(v) ? v : [];
    });
  
    let childCache: FieldState[][] = [];
    let cachedLength = -1;
    let cachedChildrenView: FieldState[][] = [];

    const createChildGroup = (index: number): FieldState[] =>
      config.itemConfig.map(childConfig => {
        const childPath = `${path}.${index}.${childConfig.name}`;

        return createNestedFieldState(
          childPath,
          childConfig,
          modelSignal,
          contextSignal,
          expr,
          arrays,
          undefined,
          treeTemplate,
          validators
        );
      });

    const invalidateChildCacheFrom = (index: number): void => {
      childCache = childCache.slice(0, Math.max(0, index));
      cachedLength = -1;
      cachedChildrenView = [];
    };

    const children: Signal<FieldState[][]> = computed(() => {
      const length = value().length;

      if (length === cachedLength) {
        return cachedChildrenView;
      }

      if (childCache.length > length) {
        childCache = childCache.slice(0, length);
      }

      while (childCache.length < length) {
        childCache.push(createChildGroup(childCache.length));
      }

      cachedLength = length;
      cachedChildrenView = childCache.slice();
      return cachedChildrenView;
    });

    const buildCtx = () => ({
      model: modelSignal(),
      context: contextSignal(),
      value: value()
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

    const errors = computed<Record<string, string> | null>(() => {
      if (!visible()) {
        return null;
      }

      const result: Record<string, string> = { ...(externalErrors() ?? {}) };
      const currentValue = value();

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
            helpers: formValidationHelpers
          });
          if (validationResult && validationResult !== true) {
            validationResult.forEach((error, errorIndex) => {
              result[`custom-${index}-${errorIndex}`] = error.message;
            });
          }
          return;
        }

        const invalid = evaluateArrayRule(rule, currentValue, buildCtx(), expr);
        if (invalid) {
          const key = `${rule.severity === 'warning' ? 'warning' : 'error'}-${rule.type ?? 'expression'}-${index}`;
          result[key] = expr.renderTemplate(rule.message, buildCtx());
        }
      });

      return Object.keys(result).length ? result : null;
    });
  
    return {
      fieldConfig: config as any,
      type: 'array',
      name: config.name,
      label: config.label,
      path,
      width: config.width,
      value,
      setValue: () => {},
      touched,
      focusing: signal(false),
      blurred: signal(false),
      dirty,
      externalErrors,
      visible,
      disabled,
      required,
      options: computed(() => []),
      errors,
      valid: computed(() => {
        if (!visible()) {
          return true;
        }

        return !errors() && children().every(group =>
          group.every(f => f.valid())
        );
      }),
      markAsTouched() {
        touched.set(true);
      },
      markAsFocused() {},
      markAsBlurred() {},
      arrayState: {
        addItem() {
  
          const defaultItem = config.itemConfig.reduce(
            (acc: any, field) => {
              acc[field.name] = null;
              return acc;
            },
            {}
          );

          arrayState.addItem(defaultItem);
          dirty.set(true);
          externalErrors.set(null);
        },
        removeItem(index: number) {
          const currentLength = value().length;
          arrayState.removeItem(index);
          if (index >= 0 && index < currentLength) {
            invalidateChildCacheFrom(index);
          }
          dirty.set(true);
          externalErrors.set(null);
        },
        moveItem(index: number, direction: -1 | 1) {
          arrayState.moveItem(index, direction);
          dirty.set(true);
          externalErrors.set(null);
        }
      },
      children
    };
  }

  function evaluateArrayRule(
    rule: NonNullable<ArrayFieldConfig['validation']>[number],
    value: unknown[],
    ctx: { model: unknown; context: unknown; value?: unknown },
    expr: ExpressionEngine
  ): boolean {
    if (rule.type === 'expression' || rule.expression) {
      return !!expr.evaluate(rule.expression ?? 'false', ctx);
    }

    switch (rule.type) {
      case 'min':
        return value.length < Number(rule.value);
      case 'max':
        return value.length > Number(rule.value);
      case 'regex':
        return typeof rule.value === 'string' && !new RegExp(rule.value).test(JSON.stringify(value));
      default:
        return false;
    }
  }
  
