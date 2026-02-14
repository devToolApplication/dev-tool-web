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
    ArrayState
  } from '../models/form-config.model';
  
  import { getByPath } from './form.utils';
  import { createFieldState } from './field-state';
  import { ExpressionEngine } from './expression.engine';
  
  export function createArrayFieldState<TModel extends object>(
    path: string,
    config: ArrayFieldConfig,
    modelSignal: WritableSignal<TModel>,
    contextSignal: WritableSignal<FormContext>,
    expr: ExpressionEngine,
    arrayState: ArrayState
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
  
          return createFieldState(
            childPath,
            childConfig,
            modelSignal,
            contextSignal,
            expr
          );
  
        });
  
      });
  
    });
  
    return {
      fieldConfig: config,
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
      visible: computed(() => true),
      disabled: computed(() => false),
      options: computed(() => []),
      errors: computed(() => null),
      valid: computed(() =>
        children().every(group =>
          group.every(f => f.valid())
        )
      ),
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
  