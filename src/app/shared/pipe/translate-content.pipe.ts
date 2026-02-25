import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../core/ui-services/i18n.service';

type TranslatableValue = string | Record<string, unknown> | Array<unknown> | null | undefined;

@Pipe({
  name: 'translateContent',
  standalone: false,
  pure: false
})
export class TranslateContentPipe implements PipeTransform {
  constructor(private readonly i18nService: I18nService) {}

  transform<T extends TranslatableValue>(value: T): T {
    if (typeof value !== 'string') {
      return value;
    }

    return this.i18nService.t(value) as T;
  }
}
