import { Injectable, signal } from '@angular/core';
import commonTranslations from '../i18n/common/common.i18n.json';
import mailTranslations from '../i18n/features/mail.i18n.json';
import profileTranslations from '../i18n/features/profile.i18n.json';
import reportsTranslations from '../i18n/features/reports.i18n.json';
import settingsTranslations from '../i18n/features/settings.i18n.json';

export type AppLanguage = 'vi' | 'en';
type TranslationMap = Record<AppLanguage, Record<string, string>>;

const STORAGE_KEY = 'app-language';

const TRANSLATIONS: TranslationMap = {
  vi: {
    ...commonTranslations.vi,
    ...settingsTranslations.vi,
    ...mailTranslations.vi,
    ...profileTranslations.vi,
    ...reportsTranslations.vi
  },
  en: {
    ...commonTranslations.en,
    ...settingsTranslations.en,
    ...mailTranslations.en,
    ...profileTranslations.en,
    ...reportsTranslations.en
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>((localStorage.getItem(STORAGE_KEY) as AppLanguage) ?? 'vi');

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  t(key: string): string {
    return TRANSLATIONS[this.language()][key] ?? key;
  }
}
