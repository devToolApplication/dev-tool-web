import { FormConfig } from '../../../shared/ui/form-input/models/form-config.model';

export function cloneFormConfig(value?: FormConfig): FormConfig | undefined {
  return value ? (JSON.parse(JSON.stringify(value)) as FormConfig) : undefined;
}

export function formTemplateText(value?: FormConfig): string {
  return hasFormTemplateFields(value) ? JSON.stringify(value, null, 2) : '';
}

export function hasFormTemplateFields(value: unknown): value is FormConfig {
  return isRecord(value) && Array.isArray(value['fields']) && value['fields'].length > 0;
}

export function parseFormTemplateText(value: unknown): FormConfig | undefined {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }

  const parsed = JSON.parse(text) as unknown;
  if (!hasFormTemplateFields(parsed)) {
    throw new Error('INVALID_FORM_TEMPLATE');
  }
  return parsed;
}

export function tryParseFormTemplateText(value: unknown): { template?: FormConfig; invalid: boolean } {
  const text = String(value ?? '').trim();
  if (!text) {
    return { invalid: false };
  }

  try {
    return { template: parseFormTemplateText(text), invalid: false };
  } catch {
    return { invalid: true };
  }
}

export function formTemplateSignature(value?: FormConfig): string {
  return hasFormTemplateFields(value) ? JSON.stringify(value) : '';
}

export function mergeDefaultValue(defaultValue: Record<string, unknown>, currentValue: Record<string, unknown>): Record<string, unknown> {
  return mergeValue(defaultValue, currentValue) as Record<string, unknown>;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function stringValue(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function mergeValue(defaultValue: unknown, currentValue: unknown): unknown {
  if (currentValue !== undefined) {
    if (isRecord(defaultValue) && isRecord(currentValue)) {
      const result: Record<string, unknown> = { ...defaultValue };
      Object.entries(currentValue).forEach(([key, value]) => {
        result[key] = mergeValue(defaultValue[key], value);
      });
      return result;
    }

    return currentValue;
  }

  if (Array.isArray(defaultValue)) {
    return [...defaultValue];
  }

  if (isRecord(defaultValue)) {
    return { ...defaultValue };
  }

  return defaultValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
