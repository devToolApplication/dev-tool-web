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
    ArrayState,
    TreeFieldConfig
  } from '../models/form-config.model';
  
  import { getByPath } from './form.utils';
  import { ExpressionEngine } from './expression.engine';
  import { createNestedFieldState } from './create-nested-field-state';
  
  export function createArrayFieldState<TModel extends object>(
    path: string,
    config: ArrayFieldConfig,
    modelSignal: WritableSignal<TModel>,
    contextSignal: WritableSignal<FormContext>,
    expr: ExpressionEngine,
    arrayState: ArrayState,
    arrays: Record<string, ArrayState>,
    treeTemplate?: TreeFieldConfig
  ): ArrayFieldState<TModel> {
  
    const touched = signal(false);
    const dirty = signal(false);
  
    const value = computed(() => {
      const v = getByPath(modelSignal(), path);
      return Array.isArray(v) ? v : [];
    });
  
    const children: Signal<FieldState[][]> = computed(() => {
  
      const arr = value();
      const length = arr.length;
  
      return Array.from({ length }, (_, index) => {
  
        return config.itemConfig.map(childConfig => {

          const childPath =
            `${path}.${index}.${childConfig.name}`;

          return createNestedFieldState(
            childPath,
            childConfig,
            modelSignal,
            contextSignal,
            expr,
            arrays,
            undefined,
            treeTemplate
          );

        });
  
      });
  
    });

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
      visible,
      disabled,
      options: computed(() => []),
      errors: computed(() => null),
      valid: computed(() => {
        if (!visible()) {
          return true;
        }

        return children().every(group =>
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
        },
        removeItem: arrayState.removeItem
      },
      children
    };
  }
  
