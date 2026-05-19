import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export type ThemeCustomToken =
  | 'primary'
  | 'surface'
  | 'border'
  | 'successText'
  | 'dangerText'
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
    primary: '#2563eb',
    surface: '#ffffff',
    border: '#d8dee8',
    successText: '#047857',
    dangerText: '#be123c',
    selectBackground: 'var(--app-surface-strong)',
    selectText: 'var(--app-text)',
    inputBackground: 'var(--app-input-bg)',
    inputText: 'var(--app-text)',
    appText: 'var(--app-text)'
  },
  dark: {
    primary: '#60a5fa',
    surface: '#111827',
    border: '#263244',
    successText: '#86efac',
    dangerText: '#fda4af',
    selectBackground: 'var(--app-surface-strong)',
    selectText: 'var(--app-text)',
    inputBackground: 'var(--app-input-bg)',
    inputText: 'var(--app-text)',
    appText: 'var(--app-text)'
  }
};

const CSS_VAR_MAP: Record<ThemeMode, Record<ThemeCustomToken, string>> = {
  light: {
    primary: '--app-custom-light-primary',
    surface: '--app-custom-light-surface',
    border: '--app-custom-light-border',
    successText: '--app-custom-light-success-text',
    dangerText: '--app-custom-light-danger-text',
    selectBackground: '--app-custom-light-select-bg',
    selectText: '--app-custom-light-select-text',
    inputBackground: '--app-custom-light-input-bg',
    inputText: '--app-custom-light-input-text',
    appText: '--app-custom-light-text'
  },
  dark: {
    primary: '--app-custom-dark-primary',
    surface: '--app-custom-dark-surface',
    border: '--app-custom-dark-border',
    successText: '--app-custom-dark-success-text',
    dangerText: '--app-custom-dark-danger-text',
    selectBackground: '--app-custom-dark-select-bg',
    selectText: '--app-custom-dark-select-text',
    inputBackground: '--app-custom-dark-input-bg',
    inputText: '--app-custom-dark-input-text',
    appText: '--app-custom-dark-text'
  }
};

const OPTIONS: Record<ThemeCustomToken, ThemeCustomOption[]> = {
  primary: [
    { label: 'blue', value: '#2563eb' },
    { label: 'cyan', value: '#0891b2' },
    { label: 'violet', value: '#7c3aed' },
    { label: 'green', value: '#059669' }
  ],
  surface: [
    { label: 'white', value: '#ffffff' },
    { label: 'slate50', value: '#f8fafc' },
    { label: 'surface0', value: 'var(--p-surface-0)' },
    { label: 'surface50', value: 'var(--p-surface-50)' }
  ],
  border: [
    { label: 'slateBorder', value: '#d8dee8' },
    { label: 'slateSoft', value: '#e2e8f0' },
    { label: 'surface200', value: 'var(--p-surface-200)' },
    { label: 'surface300', value: 'var(--p-surface-300)' }
  ],
  successText: [
    { label: 'green', value: '#047857' },
    { label: 'emerald', value: '#059669' },
    { label: 'chartSuccess', value: 'var(--app-chart-success)' },
    { label: 'primeGreen', value: 'var(--p-green-700)' }
  ],
  dangerText: [
    { label: 'rose', value: '#be123c' },
    { label: 'red', value: '#dc2626' },
    { label: 'chartDanger', value: 'var(--app-chart-danger)' },
    { label: 'primeRed', value: 'var(--p-red-700)' }
  ],
  selectBackground: [
    { label: 'contentBackground', value: 'var(--p-content-background)' },
    { label: 'surface0', value: 'var(--p-surface-0)' },
    { label: 'surface50', value: 'var(--p-surface-50)' },
    { label: 'surface100', value: 'var(--p-surface-100)' }
  ],
  selectText: [
    { label: 'contentColor', value: 'var(--p-content-color)' },
    { label: 'textColor', value: 'var(--p-text-color)' },
    { label: 'surface900', value: 'var(--p-surface-900)' },
    { label: 'surface950', value: 'var(--p-surface-950)' }
  ],
  inputBackground: [
    { label: 'formFieldBackground', value: 'var(--p-form-field-background)' },
    { label: 'surface0', value: 'var(--p-surface-0)' },
    { label: 'surface50', value: 'var(--p-surface-50)' },
    { label: 'surface100', value: 'var(--p-surface-100)' }
  ],
  inputText: [
    { label: 'formFieldColor', value: 'var(--p-form-field-color)' },
    { label: 'textColor', value: 'var(--p-text-color)' },
    { label: 'surface900', value: 'var(--p-surface-900)' },
    { label: 'surface950', value: 'var(--p-surface-950)' }
  ],
  appText: [
    { label: 'textColor', value: 'var(--p-text-color)' },
    { label: 'contentColor', value: 'var(--p-content-color)' },
    { label: 'surface900', value: 'var(--p-surface-900)' },
    { label: 'surface950', value: 'var(--p-surface-950)' }
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
          primary: parsed.light?.primary ?? DEFAULT_STATE.light.primary,
          surface: parsed.light?.surface ?? DEFAULT_STATE.light.surface,
          border: parsed.light?.border ?? DEFAULT_STATE.light.border,
          successText: parsed.light?.successText ?? DEFAULT_STATE.light.successText,
          dangerText: parsed.light?.dangerText ?? DEFAULT_STATE.light.dangerText,
          selectBackground: parsed.light?.selectBackground ?? DEFAULT_STATE.light.selectBackground,
          selectText: parsed.light?.selectText ?? DEFAULT_STATE.light.selectText,
          inputBackground: parsed.light?.inputBackground ?? DEFAULT_STATE.light.inputBackground,
          inputText: parsed.light?.inputText ?? DEFAULT_STATE.light.inputText,
          appText: parsed.light?.appText ?? DEFAULT_STATE.light.appText
        },
        dark: {
          primary: parsed.dark?.primary ?? DEFAULT_STATE.dark.primary,
          surface: parsed.dark?.surface ?? DEFAULT_STATE.dark.surface,
          border: parsed.dark?.border ?? DEFAULT_STATE.dark.border,
          successText: parsed.dark?.successText ?? DEFAULT_STATE.dark.successText,
          dangerText: parsed.dark?.dangerText ?? DEFAULT_STATE.dark.dangerText,
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
