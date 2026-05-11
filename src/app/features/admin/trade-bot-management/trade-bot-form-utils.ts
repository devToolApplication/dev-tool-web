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
