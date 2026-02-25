import { Pipe, PipeTransform } from '@angular/core';
import { AppLanguage, I18nService } from '../../core/ui-services/i18n.service';

type TranslatableValue = string | Record<string, unknown> | Array<unknown> | null | undefined;

const IN_PROGRESS = Symbol('translate-content-in-progress');

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
    'promptLabel',
    'weakLabel',
    'mediumLabel',
    'strongLabel',
    'selectedItemsLabel',
    'emptyMessage'
  ]);

  constructor(private readonly i18nService: I18nService) {}

  private readonly objectCache = new WeakMap<object, Map<AppLanguage, unknown | typeof IN_PROGRESS>>();

  private readonly stringCache = new Map<AppLanguage, Map<string, string>>();

  transform<T extends TranslatableValue>(value: T): T {
    const language = this.i18nService.language();

    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      return this.translateString(value, language) as T;
    }

    if (Array.isArray(value)) {
      return this.translateObject(value, language, (source) =>
        source.map((item) => this.transform(item as TranslatableValue))
      ) as T;
    }

    if (typeof value === 'object') {
      return this.translateObject(value, language, (source) => {
        const translatedEntries = Object.entries(source).map(([key, itemValue]) => {
          if (typeof itemValue === 'string' && this.translatableKeys.has(key)) {
            return [key, this.translateString(itemValue, language)];
          }

          if (Array.isArray(itemValue) || (itemValue !== null && typeof itemValue === 'object')) {
            return [key, this.transform(itemValue as TranslatableValue)];
          }

          return [key, itemValue];
        });

        return Object.fromEntries(translatedEntries);
      }) as T;
    }

    return value;
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

  private translateObject<TInput extends object, TOutput>(
    source: TInput,
    language: AppLanguage,
    translateFn: (source: TInput) => TOutput
  ): TOutput {
    let languageCache = this.objectCache.get(source);

    if (!languageCache) {
      languageCache = new Map<AppLanguage, unknown | typeof IN_PROGRESS>();
      this.objectCache.set(source, languageCache);
    }

    const cached = languageCache.get(language);
    if (cached === IN_PROGRESS) {
      return source as unknown as TOutput;
    }

    if (cached !== undefined) {
      return cached as TOutput;
    }

    languageCache.set(language, IN_PROGRESS);

    try {
      const translated = translateFn(source);
      languageCache.set(language, translated);
      return translated;
    } catch (error) {
      languageCache.delete(language);
      throw error;
    }
  }
}
