import { SelectOption } from '../shared/ui/form-input/models/form-config.model';

export function toUniqueTextOptions<T>(
  items: readonly T[],
  pickValue: (item: T) => unknown
): SelectOption[] {
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

export function toEntityRefOptions<T>(
  items: readonly T[],
  pickValue: (item: T) => unknown,
  pickLabel: (item: T) => unknown
): SelectOption[] {
  const options: SelectOption[] = [];

  items.forEach((item) => {
    const value = String(pickValue(item) ?? '').trim();
    if (!value) {
      return;
    }

    const label = String(pickLabel(item) ?? value).trim();
    options.push({ label: label || value, value });
  });

  return options.sort((left, right) => left.label.localeCompare(right.label));
}
