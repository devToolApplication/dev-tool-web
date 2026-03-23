import { WritableSignal } from '@angular/core';
import {
  ArrayFieldConfig,
  ArrayFieldState,
  ArrayState,
  FieldConfig,
  FieldState,
  FormContext,
  TreeFieldConfig
} from '../models/form-config.model';
import { ExpressionEngine } from './expression.engine';
import { createArrayFieldState } from './array-field-state';
import { createArrayState } from './array-state';
import { createFieldGroupState } from './create-field-group-state';
import { createFieldState } from './field-state';
import { createFieldTreeState } from './create-tree-field-state';

export function createNestedFieldState<TFormModel extends object>(
  path: string,
  config: FieldConfig,
  modelSignal: WritableSignal<TFormModel>,
  contextSignal: WritableSignal<FormContext>,
  expr: ExpressionEngine,
  arrays: Record<string, ArrayState>,
  groupName?: string,
  treeTemplate?: TreeFieldConfig
): FieldState | ArrayFieldState {
  if (config.type === 'group') {
    return createFieldGroupState(path, config, modelSignal, contextSignal, expr, arrays);
  }

  if (config.type === 'tree') {
    return createFieldTreeState(path, config, modelSignal, contextSignal, expr, arrays, treeTemplate);
  }

  if (config.type === 'array') {
    const arrayState = createArrayState(path, modelSignal);
    arrays[path] = arrayState;
    return createArrayFieldState(
      path,
      config as ArrayFieldConfig,
      modelSignal,
      contextSignal,
      expr,
      arrayState,
      arrays,
      treeTemplate
    );
  }

  return createFieldState(path, config, modelSignal, contextSignal, expr, groupName);
}
