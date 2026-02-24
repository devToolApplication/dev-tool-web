import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'appTranslate',
  standalone: false,
  pure: false
})
export class AppTranslatePipe implements PipeTransform {
  constructor(private readonly i18nService: I18nService) {}

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return this.i18nService.t(value);
  }
}
