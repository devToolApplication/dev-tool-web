import { Injectable, signal } from '@angular/core';
import commonTranslations from '../i18n/common/common.i18n.json';
import aiAgentTranslations from '../i18n/features/ai-agent.i18n.json';
import dashboardTranslations from '../i18n/features/dashboard.i18n.json';
import errorsTranslations from '../i18n/features/errors.i18n.json';
import layoutTranslations from '../i18n/features/layout.i18n.json';
import mailTranslations from '../i18n/features/mail.i18n.json';
import mcpToolConfigTranslations from '../i18n/features/mcp-tool-config.i18n.json';
import profileTranslations from '../i18n/features/profile.i18n.json';
import reportsTranslations from '../i18n/features/reports.i18n.json';
import settingsTranslations from '../i18n/features/settings.i18n.json';
import uploadStorageTranslations from '../i18n/features/upload-storage.i18n.json';

export type AppLanguage = 'vi' | 'en';
type TranslationMap = Record<AppLanguage, Record<string, string>>;

const STORAGE_KEY = 'app-language';

const TRANSLATIONS: TranslationMap = {
  vi: {
    ...commonTranslations.vi,
    ...layoutTranslations.vi,
    ...dashboardTranslations.vi,
    ...aiAgentTranslations.vi,
    ...errorsTranslations.vi,
    ...settingsTranslations.vi,
    ...mailTranslations.vi,
    ...profileTranslations.vi,
    ...reportsTranslations.vi,
    ...mcpToolConfigTranslations.vi,
    ...uploadStorageTranslations.vi
  },
  en: {
    ...commonTranslations.en,
    ...layoutTranslations.en,
    ...dashboardTranslations.en,
    ...aiAgentTranslations.en,
    ...errorsTranslations.en,
    ...settingsTranslations.en,
    ...mailTranslations.en,
    ...profileTranslations.en,
    ...reportsTranslations.en,
    ...mcpToolConfigTranslations.en,
    ...uploadStorageTranslations.en
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>((localStorage.getItem(STORAGE_KEY) as AppLanguage) ?? 'vi');

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
