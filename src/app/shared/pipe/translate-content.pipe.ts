import { Pipe, PipeTransform } from '@angular/core';
import { AppLanguage, I18nService } from '../../core/ui-services/i18n.service';

@Pipe({
  name: 'translateContent',
  standalone: false,
  pure: false
})
export class TranslateContentPipe implements PipeTransform {
  private readonly translatableKeys = new Set([
    'label',
    'placeholder',
    'title',
    'selectedItemsLabel',
    'emptyMessage'
  ]);

  constructor(private readonly i18nService: I18nService) {}

  private readonly objectCache = new WeakMap<object, Map<AppLanguage, unknown>>();

  private readonly stringCache = new Map<AppLanguage, Map<string, string>>();

  transform<T>(value: T): T {
    const language = this.i18nService.language();
    return this.translateValue(value, language, new WeakMap<object, unknown>()) as T;
  }

  private translateValue(value: unknown, language: AppLanguage, seen: WeakMap<object, unknown>): unknown {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      return this.translateString(value, language);
    }

    if (Array.isArray(value)) {
      return this.translateArray(value, language, seen);
    }

    if (typeof value === 'object') {
      return this.translateRecord(value as Record<string, unknown>, language, seen);
    }

    return value;
  }

  private translateArray(source: unknown[], language: AppLanguage, seen: WeakMap<object, unknown>): unknown[] {
    const tracked = seen.get(source);
    if (tracked) {
      return tracked as unknown[];
    }

    const cached = this.cachedObject(source, language);
    if (cached) {
      seen.set(source, cached);
      return cached as unknown[];
    }

    const translated: unknown[] = [];
    seen.set(source, translated);
    this.cacheObject(source, language, translated);

    source.forEach((item) => translated.push(this.translateValue(item, language, seen)));
    return translated;
  }

  private translateRecord(source: Record<string, unknown>, language: AppLanguage, seen: WeakMap<object, unknown>): Record<string, unknown> {
    const tracked = seen.get(source);
    if (tracked) {
      return tracked as Record<string, unknown>;
    }

    const cached = this.cachedObject(source, language);
    if (cached) {
      seen.set(source, cached);
      return cached as Record<string, unknown>;
    }

    const translated: Record<string, unknown> = {};
    seen.set(source, translated);
    this.cacheObject(source, language, translated);

    Object.entries(source).forEach(([key, itemValue]) => {
      translated[key] =
        typeof itemValue === 'string' && this.translatableKeys.has(key)
          ? this.translateString(itemValue, language)
          : this.translateValue(itemValue, language, seen);
    });

    return translated;
  }

  private translateString(value: string, language: AppLanguage): string {
    let languageCache = this.stringCache.get(language);

    if (!languageCache) {
      languageCache = new Map<string, string>();
      this.stringCache.set(language, languageCache);
    }

    const cached = languageCache.get(value);
    if (cached !== undefined) {
      return cached;
    }

    const translated = this.i18nService.t(value);
    languageCache.set(value, translated);
    return translated;
  }

  private cachedObject(source: object, language: AppLanguage): unknown {
    return this.objectCache.get(source)?.get(language);
  }

  private cacheObject(source: object, language: AppLanguage, translated: unknown): void {
    let languageCache = this.objectCache.get(source);

    if (!languageCache) {
      languageCache = new Map<AppLanguage, unknown>();
      this.objectCache.set(source, languageCache);
    }

    languageCache.set(language, translated);
  }
}
