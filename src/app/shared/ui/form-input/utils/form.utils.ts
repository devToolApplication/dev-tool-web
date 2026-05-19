import { BaseFieldConfig, GridWidth } from "../models/form-config.model";
import type { ExpressionEngine } from './expression.engine';

export function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function updateByPath(obj: any, path: string, value: any) {

  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const newObj = Array.isArray(obj)
    ? [...obj]
    : { ...obj };

  let current: any = newObj;

  keys.forEach((key, index) => {

    const nextKey = keys[index + 1];

    const isNextIndex = !isNaN(Number(nextKey));

    if (Array.isArray(current[key])) {
      current[key] = [...current[key]];
    } else if (typeof current[key] === 'object' && current[key] !== null) {
      current[key] = { ...current[key] };
    } else if (isNextIndex) {
      current[key] = [];
    } else {
      current[key] = {};
    }

    current = current[key];
  });

  if (Array.isArray(current)) {
    current[Number(lastKey)] = value;
  } else {
    current[lastKey] = value;
  }

  return newObj;
}

export function getColClass(width?: GridWidth): string {
  const map: Record<GridWidth, string> = {
    '1/2': 'col-span-12 md:col-span-6',
    '1/3': 'col-span-12 md:col-span-4',
    '1/4': 'col-span-12 md:col-span-3',
    '1/6': 'col-span-12 md:col-span-2',
    'full': 'col-span-12'
  };

  return map[width ?? 'full'];
}

export function resolveVisibleExpression(config: BaseFieldConfig): string | undefined {
  return config.visibleWhen ?? config.rules?.visible;
}

export function resolveDisabledExpression(config: BaseFieldConfig): string | undefined {
  return config.disabledWhen ?? config.rules?.disabled;
}

export function isRequiredByConfig(
  config: BaseFieldConfig,
  expr: ExpressionEngine,
  ctx: { model: unknown; context: unknown; value?: unknown }
): boolean {
  if (config.required === true || config.validation?.some((rule) => rule.type === 'required')) {
    return true;
  }

  return config.requiredWhen ? !!expr.evaluate(config.requiredWhen, ctx) : false;
}

export function requiredMessage(config: BaseFieldConfig): string {
  return (
    config.requiredWhenMessage ??
    config.validation?.find((rule) => rule.type === 'required')?.message ??
    'shared.validation.required'
  );
}

export function isEmptyFormValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return value === '';
}
