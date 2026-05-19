export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value as T;
  }
  return JSON.parse(value) as T;
}

export function stringifyJson(value: unknown, fallback: unknown): string {
  return JSON.stringify(value ?? fallback, null, 2);
}

export interface TextOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export function toUniqueTextOptions<T>(
  items: readonly T[],
  pickValue: (item: T) => unknown
): TextOption[] {
  const values = new Set<string>();

  items.forEach((item) => {
    const value = String(pickValue(item) ?? '').trim();
    if (value) {
      values.add(value);
    }
  });

  return [...values]
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ label: value, value }));
}

export function mergeTextOptions(...groups: readonly TextOption[][]): TextOption[] {
  const optionsByValue = new Map<string, TextOption>();

  groups.flat().forEach((option) => {
    const key = String(option.value ?? '').trim();
    if (key && !optionsByValue.has(key)) {
      optionsByValue.set(key, option);
    }
  });

  return [...optionsByValue.values()];
}
