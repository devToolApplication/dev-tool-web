import { AfterViewChecked, Component, DestroyRef, ElementRef, Inject, Input, OnChanges, Optional, SimpleChanges, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldState, SecretMetadataFieldConfig, SelectOption } from '../../models/form-config.model';
import { FORM_INPUT_OPTIONS_LOADERS, FormInputOptionsLoader } from '../../utils/form-input-options-loader';

type MetadataType = 'RAW_TEXT' | 'KEYCLOAK_AUTH' | 'BASIC_AUTH';
type LegacyMetadataType = 'CONFIG' | 'SECRET';
type KeycloakGrantType = 'CLIENT_CREDENTIALS' | 'PASSWORD';

interface MetadataAuthConfig {
  tokenUrl?: string;
  clientId?: string;
  clientSecretId?: string;
  grantType?: KeycloakGrantType;
  username?: string;
  passwordSecretId?: string;
  scope?: string;
}

interface MetadataEntry {
  key: string;
  type: MetadataType;
  value?: string;
  config?: MetadataAuthConfig;
}

interface RawMetadataEntry {
  key?: unknown;
  type?: MetadataType | LegacyMetadataType;
  value?: unknown;
  config?: Partial<Record<keyof MetadataAuthConfig, unknown>>;
}

@Component({
  selector: 'app-field-secret-metadata-renderer',
  standalone: false,
  templateUrl: './field-secret-metadata-renderer.html',
  styleUrl: './field-secret-metadata-renderer.css'
})
export class FieldSecretMetadataRendererComponent implements AfterViewChecked, OnChanges {
  @Input({ required: true }) field!: FieldState;
  readonly serviceOptions = signal<SelectOption[]>([]);

  constructor(
    @Optional() @Inject(FORM_INPUT_OPTIONS_LOADERS) private readonly optionLoaders: FormInputOptionsLoader[] | null,
    private readonly destroyRef: DestroyRef,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  get config(): SecretMetadataFieldConfig {
    return this.field.fieldConfig as SecretMetadataFieldConfig;
  }

  get entries(): MetadataEntry[] {
    const value = this.field.value();
    if (!Array.isArray(value) || !value.length) {
      return [this.createEntry()];
    }

    return value.map((entry) => this.normalizeEntry(entry as RawMetadataEntry));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.loadOptions();
    }
  }

  ngAfterViewChecked(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLElement>('.p-fieldset-content-container[role="region"]')
      .forEach((container) => {
        container.removeAttribute('role');
        container.removeAttribute('aria-labelledby');
      });
  }

  get secretOptions(): SelectOption[] {
    return this.config.optionsSource ? this.serviceOptions() : this.field.options();
  }

  get typeOptions(): SelectOption[] {
    return this.config.typeOptions ?? [
      { label: 'rawText', value: 'RAW_TEXT' },
      { label: 'keycloakAuth', value: 'KEYCLOAK_AUTH' },
      { label: 'basicAuth', value: 'BASIC_AUTH' }
    ];
  }

  get grantTypeOptions(): SelectOption[] {
    return this.config.grantTypeOptions ?? [
      { label: 'clientCredentials', value: 'CLIENT_CREDENTIALS' },
      { label: 'passwordGrant', value: 'PASSWORD' }
    ];
  }

  addEntry(): void {
    this.field.setValue([...this.entries, this.createEntry()]);
  }

  removeEntry(index: number): void {
    const nextEntries = this.entries.filter((_, itemIndex) => itemIndex !== index);
    this.field.setValue(nextEntries.length ? nextEntries : [this.createEntry()]);
  }

  updateKey(index: number, value: string | null): void {
    this.patchEntry(index, { key: value ?? '' });
  }

  updateType(index: number, value: string | number | boolean | null): void {
    const type = this.normalizeType(value);
    this.patchEntry(index, {
      type,
      value: type === 'RAW_TEXT' ? '' : undefined,
      config: type === 'RAW_TEXT' ? undefined : this.createAuthConfig(type)
    });
  }

  updateValue(index: number, value: string | number | boolean | null): void {
    this.patchEntry(index, { value: value == null ? '' : String(value) });
  }

  updateConfig(index: number, key: keyof MetadataAuthConfig, value: string | number | boolean | null): void {
    const entry = this.entries[index] ?? this.createEntry();
    this.patchEntry(index, {
      config: {
        ...this.createAuthConfig(entry.type),
        ...(entry.config ?? {}),
        [key]: value == null ? '' : String(value)
      }
    });
  }

  isPasswordGrant(entry: MetadataEntry): boolean {
    return entry.type === 'KEYCLOAK_AUTH' && entry.config?.grantType === 'PASSWORD';
  }

  trackByIndex(index: number): number {
    return index;
  }

  private loadOptions(): void {
    const source = this.config.optionsSource;
    if (!source) {
      this.serviceOptions.set([]);
      return;
    }

    const loader = this.optionLoaders?.find((item) => item.source === source);
    if (!loader) {
      this.serviceOptions.set([]);
      return;
    }

    loader
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.serviceOptions.set(items),
        error: () => this.serviceOptions.set([])
      });
  }

  private patchEntry(index: number, patch: Partial<MetadataEntry>): void {
    const nextEntries = this.entries.map((entry, itemIndex) => (itemIndex === index ? { ...entry, ...patch } : entry));
    this.field.setValue(nextEntries.map((entry) => this.toPayloadEntry(entry)));
  }

  private createEntry(): MetadataEntry {
    return { key: '', type: 'RAW_TEXT', value: '' };
  }

  private normalizeEntry(entry: RawMetadataEntry): MetadataEntry {
    const type = this.normalizeType(entry?.type);
    return {
      key: String(entry?.key ?? ''),
      type,
      value: type === 'RAW_TEXT' ? String(entry?.value ?? '') : undefined,
      config: type === 'RAW_TEXT' ? undefined : this.normalizeAuthConfig(type, entry?.config)
    };
  }

  private normalizeType(value: unknown): MetadataType {
    if (value === 'KEYCLOAK_AUTH' || value === 'BASIC_AUTH') {
      return value;
    }

    return 'RAW_TEXT';
  }

  private normalizeAuthConfig(type: MetadataType, config?: Partial<Record<keyof MetadataAuthConfig, unknown>>): MetadataAuthConfig {
    if (type === 'RAW_TEXT') {
      return {};
    }

    const defaults = this.createAuthConfig(type);
    return {
      ...defaults,
      tokenUrl: String(config?.tokenUrl ?? defaults.tokenUrl ?? ''),
      clientId: String(config?.clientId ?? defaults.clientId ?? ''),
      clientSecretId: String(config?.clientSecretId ?? defaults.clientSecretId ?? ''),
      grantType: config?.grantType === 'PASSWORD' ? 'PASSWORD' : (defaults.grantType ?? 'CLIENT_CREDENTIALS'),
      username: String(config?.username ?? defaults.username ?? ''),
      passwordSecretId: String(config?.passwordSecretId ?? defaults.passwordSecretId ?? ''),
      scope: String(config?.scope ?? defaults.scope ?? '')
    };
  }

  private createAuthConfig(type: MetadataType): MetadataAuthConfig {
    if (type === 'KEYCLOAK_AUTH') {
      return {
        tokenUrl: '',
        clientId: '',
        clientSecretId: '',
        grantType: 'CLIENT_CREDENTIALS',
        username: '',
        passwordSecretId: '',
        scope: ''
      };
    }

    if (type === 'BASIC_AUTH') {
      return {
        username: '',
        passwordSecretId: ''
      };
    }

    return {};
  }

  private toPayloadEntry(entry: MetadataEntry): MetadataEntry {
    const key = entry.key ?? '';
    if (entry.type === 'RAW_TEXT') {
      return { key, type: 'RAW_TEXT', value: entry.value ?? '' };
    }

    const config = this.normalizeAuthConfig(entry.type, entry.config);
    if (entry.type === 'BASIC_AUTH') {
      return {
        key,
        type: 'BASIC_AUTH',
        config: {
          username: config.username ?? '',
          passwordSecretId: config.passwordSecretId ?? ''
        }
      };
    }

    return {
      key,
      type: 'KEYCLOAK_AUTH',
      config: {
        tokenUrl: config.tokenUrl ?? '',
        clientId: config.clientId ?? '',
        clientSecretId: config.clientSecretId ?? '',
        grantType: config.grantType ?? 'CLIENT_CREDENTIALS',
        username: config.username ?? '',
        passwordSecretId: config.passwordSecretId ?? '',
        scope: config.scope ?? ''
      }
    };
  }
}
