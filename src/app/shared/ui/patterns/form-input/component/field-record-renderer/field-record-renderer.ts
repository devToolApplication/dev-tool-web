import { Component, Input } from '@angular/core';
import type { FieldState, RecordFieldConfig } from '../../models/form-config.model';

type RecordEntry = { key: string; value: string };

@Component({
  selector: 'app-field-record-renderer',
  standalone: false,
  templateUrl: './field-record-renderer.html',
  styleUrl: './field-record-renderer.css',
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
      value: String(item ?? ''),
    }));
  }

  onRecordAdd(): void {
    const current = this.toRecordObject();
    const next = { ...current, [this.nextKey(current)]: '' };
    this.field.setValue(next);
  }

  onRecordRemove(index: number): void {
    const entries = this.recordEntries.filter((_, i) => i !== index);
    this.field.setValue(this.entriesToRecord(entries));
  }

  onRecordKeyChange(index: number, key: string | null): void {
    const entries = this.recordEntries;
    entries[index] = { ...entries[index], key: key ?? '' };
    this.field.setValue(this.entriesToRecord(entries));
  }

  onRecordValueChange(index: number, value: string | null): void {
    const entries = this.recordEntries;
    entries[index] = { ...entries[index], value: value ?? '' };
    this.field.setValue(this.entriesToRecord(entries));
  }

  private toRecordObject(): Record<string, string> {
    const value = this.field.value();
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [key, item]) => {
        acc[key] = String(item ?? '');
        return acc;
      },
      {},
    );
  }

  private entriesToRecord(entries: RecordEntry[]): Record<string, string> {
    const result: Record<string, string> = {};

    entries.forEach((entry, index) => {
      const normalizedKey = entry.key.trim();
      const fallbackKey = `key_${index + 1}`;
      const baseKey = normalizedKey || fallbackKey;
      const key = this.ensureUniqueKey(result, baseKey);
      result[key] = entry.value;
    });

    return result;
  }

  private nextKey(current: Record<string, string>): string {
    let index = Object.keys(current).length + 1;
    let key = `key_${index}`;
    while (Object.prototype.hasOwnProperty.call(current, key)) {
      index += 1;
      key = `key_${index}`;
    }
    return key;
  }

  private ensureUniqueKey(result: Record<string, string>, key: string): string {
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      return key;
    }

    let index = 2;
    let next = `${key}_${index}`;
    while (Object.prototype.hasOwnProperty.call(result, next)) {
      index += 1;
      next = `${key}_${index}`;
    }
    return next;
  }
}
