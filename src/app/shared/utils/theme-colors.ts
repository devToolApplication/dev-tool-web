export function resolveThemeColor(tokenName: string, fallbackTokenName?: string): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(tokenName).trim();
  if (value) {
    return value;
  }

  if (fallbackTokenName) {
    return styles.getPropertyValue(fallbackTokenName).trim();
  }

  return '';
}

export function resolveCssColor(value: string | undefined, fallbackTokenName?: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    return fallbackTokenName ? resolveThemeColor(fallbackTokenName) : '';
  }

  if (normalized.startsWith('var(') && normalized.endsWith(')')) {
    return resolveThemeColor(normalized.slice(4, -1).trim(), fallbackTokenName);
  }

  return normalized;
}
