import { Injectable, signal } from '@angular/core';

export type AppLanguage = 'vi' | 'en';

type I18nKey =
  | 'app.title'
  | 'app.settings'
  | 'settings.title'
  | 'settings.description'
  | 'settings.darkMode.title'
  | 'settings.darkMode.description'
  | 'settings.language.title'
  | 'settings.language.description'
  | 'language.vi'
  | 'language.en'
  | 'mail.title'
  | 'profile.title'
  | 'reports.title'
  | 'toast.loadError'
  | 'toast.saveError'
  | 'toast.deleteError'
  | 'toast.saveCreateSuccess'
  | 'toast.saveUpdateSuccess'
  | 'toast.deleteSuccess';

const STORAGE_KEY = 'app-language';

const TRANSLATIONS: Record<AppLanguage, Record<I18nKey, string>> = {
  vi: {
    'app.title': 'My App',
    'app.settings': 'Cài đặt',
    'settings.title': 'Cài đặt giao diện',
    'settings.description': 'Bật/tắt Dark mode và chọn ngôn ngữ cho toàn bộ ứng dụng.',
    'settings.darkMode.title': 'Dark mode',
    'settings.darkMode.description': 'Đổi nhanh giữa giao diện sáng và tối.',
    'settings.language.title': 'Ngôn ngữ',
    'settings.language.description': 'Chọn ngôn ngữ hiển thị cho title và toast.',
    'language.vi': 'Tiếng Việt',
    'language.en': 'English',
    'mail.title': 'Mail CRUD',
    'profile.title': 'Profile CRUD',
    'reports.title': 'Reports CRUD',
    'toast.loadError': 'Tải dữ liệu thất bại',
    'toast.saveError': 'Lưu dữ liệu thất bại',
    'toast.deleteError': 'Xoá thất bại',
    'toast.saveCreateSuccess': 'Tạo mới thành công',
    'toast.saveUpdateSuccess': 'Cập nhật thành công',
    'toast.deleteSuccess': 'Đã xoá bản ghi'
  },
  en: {
    'app.title': 'My App',
    'app.settings': 'Settings',
    'settings.title': 'Appearance settings',
    'settings.description': 'Enable/disable dark mode and select app language.',
    'settings.darkMode.title': 'Dark mode',
    'settings.darkMode.description': 'Quickly switch between light and dark themes.',
    'settings.language.title': 'Language',
    'settings.language.description': 'Choose display language for titles and toasts.',
    'language.vi': 'Vietnamese',
    'language.en': 'English',
    'mail.title': 'Mail CRUD',
    'profile.title': 'Profile CRUD',
    'reports.title': 'Reports CRUD',
    'toast.loadError': 'Failed to load data',
    'toast.saveError': 'Failed to save data',
    'toast.deleteError': 'Failed to delete record',
    'toast.saveCreateSuccess': 'Created successfully',
    'toast.saveUpdateSuccess': 'Updated successfully',
    'toast.deleteSuccess': 'Record deleted'
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<AppLanguage>((localStorage.getItem(STORAGE_KEY) as AppLanguage) ?? 'vi');

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  t(key: I18nKey): string {
    return TRANSLATIONS[this.language()][key];
  }
}
