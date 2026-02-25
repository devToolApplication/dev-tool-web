import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../core/ui-services/i18n.service';

type TranslatableValue = string | Record<string, unknown> | Array<unknown> | null | undefined;

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

  transform<T extends TranslatableValue>(value: T): T {
    if (value == null) {
      return value;
    }

    if (typeof value === 'string') {
      return this.i18nService.t(value) as T;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item as TranslatableValue)) as T;
    }

    if (typeof value === 'object') {
      const translatedEntries = Object.entries(value).map(([key, itemValue]) => {
        if (typeof itemValue === 'string' && this.translatableKeys.has(key)) {
          return [key, this.i18nService.t(itemValue)];
        }

        if (Array.isArray(itemValue) || (itemValue !== null && typeof itemValue === 'object')) {
          return [key, this.transform(itemValue as TranslatableValue)];
        }

        return [key, itemValue];
      });

      return Object.fromEntries(translatedEntries) as T;
    }

    return value;
  }
}
