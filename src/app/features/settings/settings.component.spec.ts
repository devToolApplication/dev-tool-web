import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Pipe, PipeTransform, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { I18nService } from '../../core/ui-services/i18n.service';
import { ThemeService } from '../../core/ui-services/theme.service';
import {
  ThemeCustomState,
  ThemeCustomToken,
  ThemeCustomizerService
} from '../../core/ui-services/theme-customizer.service';
import { SettingsComponent } from './settings.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

@Component({ selector: 'app-page-shell', standalone: false, template: '<ng-content></ng-content>' })
class PageShellStubComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() layout?: string;
}

@Component({ selector: 'app-tabs', standalone: false, template: '' })
class TabsStubComponent {
  @Input() tabs: unknown[] = [];
  @Input() value = '';
  @Output() readonly valueChange = new EventEmitter<string>();
}

@Component({ selector: 'app-toggle-switch', standalone: false, template: '' })
class ToggleSwitchStubComponent {
  @Input() label?: string;
  @Input() value?: boolean;
  @Output() readonly valueChange = new EventEmitter<boolean>();
}

@Component({ selector: 'app-select-button', standalone: false, template: '' })
class SelectButtonStubComponent {
  @Input() label?: string;
  @Input() options: unknown[] = [];
  @Input() value?: unknown;
  @Input() allowEmpty = true;
  @Output() readonly valueChange = new EventEmitter<unknown>();
}

@Component({ selector: 'app-select', standalone: false, template: '' })
class SelectStubComponent {
  @Input() label?: string;
  @Input() options: unknown[] = [];
  @Input() value?: unknown;
  @Output() readonly valueChange = new EventEmitter<unknown>();
}

@Component({ selector: 'app-input-text', standalone: false, template: '' })
class InputTextStubComponent {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() value?: string;
  @Output() readonly valueChange = new EventEmitter<string | null>();
}

@Component({ selector: 'app-button', standalone: false, template: '' })
class ButtonStubComponent {
  @Input() icon?: string;
  @Input() label?: string;
  @Input() severity?: string | null;
  @Output() readonly buttonClick = new EventEmitter<void>();
}

class MockThemeService {
  themeMode: 'light' | 'dark' = 'light';
  themePreset: 'aura' | 'lara' | 'nora' | 'material' = 'aura';
  availablePresets: Array<'aura' | 'lara' | 'nora' | 'material'> = ['aura', 'lara', 'nora', 'material'];

  get isDarkMode(): boolean {
    return this.themeMode === 'dark';
  }

  setDarkMode = vi.fn((enabled: boolean) => {
    this.themeMode = enabled ? 'dark' : 'light';
  });

  setThemeMode = vi.fn((mode: 'light' | 'dark') => {
    this.themeMode = mode;
  });

  setThemePreset = vi.fn((preset: 'aura' | 'lara' | 'nora' | 'material') => {
    this.themePreset = preset;
  });
}

class MockI18nService {
  language = signal<'vi' | 'en'>('vi');
  setLanguage = vi.fn((language: 'vi' | 'en') => this.language.set(language));
  t(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}

class MockThemeCustomizerService {
  state: ThemeCustomState = {
    light: this.modeState('#2563eb'),
    dark: this.modeState('#60a5fa')
  };

  getModeState(mode: 'light' | 'dark') {
    return this.state[mode];
  }

  getOptions(token: ThemeCustomToken) {
    return [{ label: token === 'primary' ? 'blue' : 'surface0', value: this.state.light[token] }];
  }

  set = vi.fn((mode: 'light' | 'dark', token: ThemeCustomToken, value: string) => {
    this.state = {
      ...this.state,
      [mode]: {
        ...this.state[mode],
        [token]: value
      }
    };
  });

  reset = vi.fn((mode?: 'light' | 'dark') => {
    const target = mode ?? 'light';
    this.state = {
      ...this.state,
      [target]: this.modeState(target === 'light' ? '#2563eb' : '#60a5fa')
    };
  });

  private modeState(primary: string) {
    return {
      primary,
      surface: '#ffffff',
      border: '#d8dee8',
      successText: '#047857',
      dangerText: '#be123c',
      selectBackground: 'var(--p-content-background)',
      selectText: 'var(--p-content-color)',
      inputBackground: 'var(--p-form-field-background)',
      inputText: 'var(--p-form-field-color)',
      appText: 'var(--p-text-color)'
    };
  }
}

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let themeService: MockThemeService;
  let i18nService: MockI18nService;
  let themeCustomizer: MockThemeCustomizerService;

  beforeEach(async () => {
    themeService = new MockThemeService();
    i18nService = new MockI18nService();
    themeCustomizer = new MockThemeCustomizerService();

    await TestBed.configureTestingModule({
      declarations: [
        SettingsComponent,
        PageShellStubComponent,
        TabsStubComponent,
        ToggleSwitchStubComponent,
        SelectButtonStubComponent,
        SelectStubComponent,
        InputTextStubComponent,
        ButtonStubComponent,
        TranslateContentPipeStub
      ],
      imports: [CommonModule],
      providers: [
        { provide: ThemeService, useValue: themeService },
        { provide: I18nService, useValue: i18nService },
        { provide: ThemeCustomizerService, useValue: themeCustomizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('renders token editors from metadata', () => {
    component.activeTab.set('theme');
    fixture.detectChanges();

    expect(component.themeTokenFields.length).toBe(10);
    expect(fixture.nativeElement.querySelectorAll('.settings-token').length).toBe(10);
  });

  it('syncs theme mode, preset and language changes to services', () => {
    component.onThemeModeChange('dark');
    component.onThemePresetChange('lara');
    component.onLanguageChange('en');

    expect(themeService.setThemeMode).toHaveBeenCalledWith('dark');
    expect(themeService.setThemePreset).toHaveBeenCalledWith('lara');
    expect(i18nService.setLanguage).toHaveBeenCalledWith('en');
    expect(component.settingsSummary()[0].value).toBe('dark');
    expect(component.settingsSummary()[1].value).toBe('settings.lara');
  });

  it('updates and resets custom token values for the selected mode', () => {
    component.onThemeTokenManualInput('primary', ' #111827 ');
    expect(themeCustomizer.set).toHaveBeenCalledWith('light', 'primary', '#111827');
    expect(component.themeTokenValue().primary).toBe('#111827');

    component.onCustomModeChange('dark');
    component.onThemeTokenChange('primary', '#93c5fd');
    expect(themeCustomizer.set).toHaveBeenCalledWith('dark', 'primary', '#93c5fd');

    component.onResetThemeConfig();
    expect(themeCustomizer.reset).toHaveBeenCalledWith('dark');
    expect(component.themeTokenValue().primary).toBe('#60a5fa');
  });

  it('falls back to general tab for invalid tab values', () => {
    component.activeTab.set('theme');

    component.onTabChange(1);

    expect(component.activeTab()).toBe('general');
  });
});
