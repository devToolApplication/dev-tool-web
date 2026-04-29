import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { AiAgentSecretUserResponse, AiAgentSecretUserService } from '../../../../../core/services/ai-agent-service/ai-agent-secret-user.service';
import { StorageSecretUserResponse, StorageSecretUserService } from '../../../../../core/services/file-service/storage-secret-user.service';
import { FieldState, SecretMetadataFieldConfig, SelectOption } from '../../models/form-config.model';

type MetadataType = 'CONFIG' | 'SECRET';

interface MetadataEntry {
  key: string;
  type: MetadataType;
  value: string;
}

@Component({
  selector: 'app-field-secret-metadata-renderer',
  standalone: false,
  templateUrl: './field-secret-metadata-renderer.html',
  styleUrl: './field-secret-metadata-renderer.css'
})
export class FieldSecretMetadataRendererComponent {
  private readonly storageSecretUserService = inject(StorageSecretUserService);
  private readonly aiAgentSecretUserService = inject(AiAgentSecretUserService);

  @Input({ required: true }) field!: FieldState;
  readonly serviceOptions = signal<SelectOption[]>([]);

  get config(): SecretMetadataFieldConfig {
    return this.field.fieldConfig as SecretMetadataFieldConfig;
  }

  get entries(): MetadataEntry[] {
    const value = this.field.value();
    if (!Array.isArray(value) || !value.length) {
      return [this.createEntry()];
    }

    return value.map((entry) => ({
      key: String(entry?.key ?? ''),
      type: entry?.type === 'SECRET' ? 'SECRET' : 'CONFIG',
      value: String(entry?.value ?? '')
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.loadOptions();
    }
  }

  get secretOptions(): SelectOption[] {
    return this.config.service ? this.serviceOptions() : this.field.options();
  }

  get typeOptions(): SelectOption[] {
    return this.config.typeOptions ?? [
      { label: 'config', value: 'CONFIG' },
      { label: 'secret', value: 'SECRET' }
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
    this.patchEntry(index, {
      type: value === 'SECRET' ? 'SECRET' : 'CONFIG',
      value: ''
    });
  }

  updateValue(index: number, value: string | number | boolean | null): void {
    this.patchEntry(index, { value: value == null ? '' : String(value) });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private loadOptions(): void {
    if (this.config.service === 'file-mcrs') {
      this.storageSecretUserService.getAll().subscribe({
        next: (items) => this.serviceOptions.set(this.mapStorageSecretOptions(items)),
        error: () => this.serviceOptions.set([])
      });
      return;
    }

    if (this.config.service === 'ai-agent-mcrs') {
      this.aiAgentSecretUserService.getAll().subscribe({
        next: (items) => this.serviceOptions.set(this.mapAiAgentSecretOptions(items)),
        error: () => this.serviceOptions.set([])
      });
      return;
    }

    this.serviceOptions.set([]);
  }

  private patchEntry(index: number, patch: Partial<MetadataEntry>): void {
    const nextEntries = this.entries.map((entry, itemIndex) => (itemIndex === index ? { ...entry, ...patch } : entry));
    this.field.setValue(nextEntries);
  }

  private createEntry(): MetadataEntry {
    return { key: '', type: 'CONFIG', value: '' };
  }

  private mapStorageSecretOptions(items: StorageSecretUserResponse[]): SelectOption[] {
    return items
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => ({ label: `${item.category} / ${item.name}`, value: item.id }));
  }

  private mapAiAgentSecretOptions(items: AiAgentSecretUserResponse[]): SelectOption[] {
    return items
      .filter((item) => item.status === 'ACTIVE')
      .map((item) => ({ label: `${item.category} / ${item.name}`, value: item.id }));
  }
}
