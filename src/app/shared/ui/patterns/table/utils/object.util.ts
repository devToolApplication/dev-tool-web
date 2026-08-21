export function getValueByPath(obj: unknown, path: string): unknown {
  if (obj == null || !path) {
    return null;
  }

  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || (typeof acc !== 'object' && typeof acc !== 'function')) {
      return null;
    }

    return (acc as Record<string, unknown>)[key] ?? null;
  }, obj);
}
