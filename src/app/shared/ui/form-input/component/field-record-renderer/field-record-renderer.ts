import { Component, Input } from '@angular/core';
import { FieldState, RecordFieldConfig } from '../../models/form-config.model';

type RecordEntry = { key: string; value: string };

@Component({
  selector: 'app-field-record-renderer',
  standalone: false,
  templateUrl: './field-record-renderer.html',
  styleUrl: './field-record-renderer.css'
})
export class FieldRecordRenderer {
  @Input({ required: true })
  field!: FieldState;

  get recordConfig(): RecordFieldConfig | undefined {
    return this.field.type === 'record' ? (this.field.fieldConfig as RecordFieldConfig) : undefined;
  }

  get recordEntries(): RecordEntry[] {
    if (this.field.type !== 'record') return [];

    const value = this.field.value();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

    return Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
      key,
      value: String(item ?? '')
    }));
  }

  onRecordAdd(): void {
    const next = { ...this.toRecordObject(), '': '' };
    this.field.setValue(next);
  }

  onRecordRemove(index: number): void {
    const entries = this.recordEntries.filter((_, i) => i !== index);
    this.field.setValue(this.entriesToRecord(entries));
  }

  onRecordKeyChange(index: number, key: string): void {
    const entries = this.recordEntries;
    entries[index] = { ...entries[index], key };
    this.field.setValue(this.entriesToRecord(entries));
  }

  onRecordValueChange(index: number, value: string): void {
    const entries = this.recordEntries;
    entries[index] = { ...entries[index], value };
    this.field.setValue(this.entriesToRecord(entries));
  }

  private toRecordObject(): Record<string, string> {
    const value = this.field.value();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, item]) => {
      acc[key] = String(item ?? '');
      return acc;
    }, {});
  }

  private entriesToRecord(entries: RecordEntry[]): Record<string, string> {
    const result: Record<string, string> = {};

    entries.forEach((entry, index) => {
      const normalizedKey = entry.key.trim();
      const fallbackKey = `key_${index + 1}`;
      const key = normalizedKey || fallbackKey;
      result[key] = entry.value;
    });

    return result;
  }
}
