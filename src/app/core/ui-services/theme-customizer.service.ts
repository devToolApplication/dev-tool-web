import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

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

export type ThemeCustomTokenState = Record<ThemeCustomToken, string>;

export interface ThemeCustomState {
  light: ThemeCustomTokenState;
  dark: ThemeCustomTokenState;
}

const STORAGE_KEY = 'app-theme-custom';

const DEFAULT_STATE: ThemeCustomState = {
  light: {
    selectBackground: 'var(--p-content-background)',
    selectText: 'var(--p-content-color)',
    inputBackground: 'var(--p-form-field-background)',
    inputText: 'var(--p-form-field-color)',
    appText: 'var(--p-text-color)'
  },
  dark: {
    selectBackground: 'var(--p-content-background)',
    selectText: 'var(--p-content-color)',
    inputBackground: 'var(--p-form-field-background)',
    inputText: 'var(--p-form-field-color)',
    appText: 'var(--p-text-color)'
  }
};

const CSS_VAR_MAP: Record<ThemeMode, Record<ThemeCustomToken, string>> = {
  light: {
    selectBackground: '--app-custom-light-select-bg',
    selectText: '--app-custom-light-select-text',
    inputBackground: '--app-custom-light-input-bg',
    inputText: '--app-custom-light-input-text',
    appText: '--app-custom-light-text'
  },
  dark: {
    selectBackground: '--app-custom-dark-select-bg',
    selectText: '--app-custom-dark-select-text',
    inputBackground: '--app-custom-dark-input-bg',
    inputText: '--app-custom-dark-input-text',
    appText: '--app-custom-dark-text'
  }
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
  private state: ThemeCustomState = this.cloneDefaultState();

  constructor() {
    this.load();
    this.apply();
  }

  get current(): ThemeCustomState {
    return this.state;
  }

  getModeState(mode: ThemeMode): ThemeCustomTokenState {
    return this.state[mode];
  }

  getOptions(token: ThemeCustomToken): ThemeCustomOption[] {
    return OPTIONS[token];
  }

  set(mode: ThemeMode, token: ThemeCustomToken, value: string): void {
    this.state = {
      ...this.state,
      [mode]: {
        ...this.state[mode],
        [token]: value
      }
    };
    this.apply();
    this.save();
  }

  reset(mode?: ThemeMode): void {
    this.state = mode
      ? { ...this.state, [mode]: { ...DEFAULT_STATE[mode] } }
      : this.cloneDefaultState();

    this.apply();
    this.save();
  }

  private apply(): void {
    (Object.keys(CSS_VAR_MAP) as ThemeMode[]).forEach((mode) => {
      (Object.keys(CSS_VAR_MAP[mode]) as ThemeCustomToken[]).forEach((token) => {
        this.root.style.setProperty(CSS_VAR_MAP[mode][token], this.state[mode][token]);
      });
    });
  }

  private load(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<ThemeCustomState>;
      this.state = {
        light: {
          selectBackground: parsed.light?.selectBackground ?? DEFAULT_STATE.light.selectBackground,
          selectText: parsed.light?.selectText ?? DEFAULT_STATE.light.selectText,
          inputBackground: parsed.light?.inputBackground ?? DEFAULT_STATE.light.inputBackground,
          inputText: parsed.light?.inputText ?? DEFAULT_STATE.light.inputText,
          appText: parsed.light?.appText ?? DEFAULT_STATE.light.appText
        },
        dark: {
          selectBackground: parsed.dark?.selectBackground ?? DEFAULT_STATE.dark.selectBackground,
          selectText: parsed.dark?.selectText ?? DEFAULT_STATE.dark.selectText,
          inputBackground: parsed.dark?.inputBackground ?? DEFAULT_STATE.dark.inputBackground,
          inputText: parsed.dark?.inputText ?? DEFAULT_STATE.dark.inputText,
          appText: parsed.dark?.appText ?? DEFAULT_STATE.dark.appText
        }
      };
    } catch {
      this.state = this.cloneDefaultState();
    }
  }

  private cloneDefaultState(): ThemeCustomState {
    return {
      light: { ...DEFAULT_STATE.light },
      dark: { ...DEFAULT_STATE.dark }
    };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}
