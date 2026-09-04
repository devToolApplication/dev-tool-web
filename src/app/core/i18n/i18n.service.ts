import { Injectable, signal } from '@angular/core';
import commonTranslations from '../i18n/common/common.i18n.json';
import errorsTranslations from '../i18n/features/errors.i18n.json';
import layoutTranslations from '../i18n/features/layout.i18n.json';
import serviceManagementTranslations from '../i18n/features/service-management.i18n.json';
import workflowStudioTranslations from '../i18n/features/workflow-studio.i18n.json';
import accountManagementTranslations from '../i18n/features/account-management.i18n.json';

export type AppLanguage = 'vi' | 'en';
type TranslationMap = Record<AppLanguage, Record<string, string>>;

const STORAGE_KEY = 'app-language';

const TRANSLATIONS: TranslationMap = {
  vi: {
    ...commonTranslations.vi,
    ...layoutTranslations.vi,
    ...errorsTranslations.vi,
    ...serviceManagementTranslations.vi,
    ...workflowStudioTranslations.vi,
    ...accountManagementTranslations.vi,
  },
  en: {
    ...commonTranslations.en,
    ...layoutTranslations.en,
    ...errorsTranslations.en,
    ...serviceManagementTranslations.en,
    ...workflowStudioTranslations.en,
    ...accountManagementTranslations.en,
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>(
    (localStorage.getItem(STORAGE_KEY) as AppLanguage) ?? 'vi',
  );

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  t(key: unknown): string {
    if (typeof key !== 'string' || !key.trim()) {
      return '';
    }

    return TRANSLATIONS[this.language()][key] ?? key;
  }
}
