import { Injectable } from '@angular/core';

export type ThemeCustomToken =
  | 'selectBackground'
  | 'selectText'
  | 'inputBackground'
  | 'inputText'
  | 'appText';

export interface ThemeCustomOption {
  label: string;
  value: string;
}

export interface ThemeCustomState {
  selectBackground: string;
  selectText: string;
  inputBackground: string;
  inputText: string;
  appText: string;
}

const STORAGE_KEY = 'app-theme-custom';

const DEFAULT_STATE: ThemeCustomState = {
  selectBackground: 'var(--p-content-background)',
  selectText: 'var(--p-content-color)',
  inputBackground: 'var(--p-form-field-background)',
  inputText: 'var(--p-form-field-color)',
  appText: 'var(--p-text-color)'
};

const CSS_VAR_MAP: Record<ThemeCustomToken, string> = {
  selectBackground: '--app-overlay-bg',
  selectText: '--app-overlay-text',
  inputBackground: '--app-input-bg',
  inputText: '--app-input-text',
  appText: '--app-text'
};

const OPTIONS: Record<ThemeCustomToken, ThemeCustomOption[]> = {
  selectBackground: [
    { label: 'Content background', value: 'var(--p-content-background)' },
    { label: 'Surface 0', value: 'var(--p-surface-0)' },
    { label: 'Surface 50', value: 'var(--p-surface-50)' },
    { label: 'Surface 100', value: 'var(--p-surface-100)' }
  ],
  selectText: [
    { label: 'Content color', value: 'var(--p-content-color)' },
    { label: 'Text color', value: 'var(--p-text-color)' },
    { label: 'Surface 900', value: 'var(--p-surface-900)' },
    { label: 'Surface 950', value: 'var(--p-surface-950)' }
  ],
  inputBackground: [
    { label: 'Form field background', value: 'var(--p-form-field-background)' },
    { label: 'Surface 0', value: 'var(--p-surface-0)' },
    { label: 'Surface 50', value: 'var(--p-surface-50)' },
    { label: 'Surface 100', value: 'var(--p-surface-100)' }
  ],
  inputText: [
    { label: 'Form field color', value: 'var(--p-form-field-color)' },
    { label: 'Text color', value: 'var(--p-text-color)' },
    { label: 'Surface 900', value: 'var(--p-surface-900)' },
    { label: 'Surface 950', value: 'var(--p-surface-950)' }
  ],
  appText: [
    { label: 'Text color', value: 'var(--p-text-color)' },
    { label: 'Content color', value: 'var(--p-content-color)' },
    { label: 'Surface 900', value: 'var(--p-surface-900)' },
    { label: 'Surface 950', value: 'var(--p-surface-950)' }
  ]
};

@Injectable({ providedIn: 'root' })
export class ThemeCustomizerService {
  private readonly root = document.documentElement;
  private state: ThemeCustomState = DEFAULT_STATE;

  constructor() {
    this.load();
    this.apply();
  }

  get current(): ThemeCustomState {
    return this.state;
  }

  getOptions(token: ThemeCustomToken): ThemeCustomOption[] {
    return OPTIONS[token];
  }

  set(token: ThemeCustomToken, value: string): void {
    this.state = { ...this.state, [token]: value };
    this.apply();
    this.save();
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.apply();
    this.save();
  }

  private apply(): void {
    (Object.keys(CSS_VAR_MAP) as ThemeCustomToken[]).forEach((token) => {
      this.root.style.setProperty(CSS_VAR_MAP[token], this.state[token]);
    });
  }

  private load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<ThemeCustomState>;
      this.state = {
        selectBackground: parsed.selectBackground ?? DEFAULT_STATE.selectBackground,
        selectText: parsed.selectText ?? DEFAULT_STATE.selectText,
        inputBackground: parsed.inputBackground ?? DEFAULT_STATE.inputBackground,
        inputText: parsed.inputText ?? DEFAULT_STATE.inputText,
        appText: parsed.appText ?? DEFAULT_STATE.appText
      };
    } catch {
      this.state = { ...DEFAULT_STATE };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}
