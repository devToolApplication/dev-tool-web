import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import type { SelectOption } from '@shared/ui/primitives/select/select';

import { JsonValue } from '../../../model/workflow-studio.model';

export type JsonFieldType = 'string' | 'number' | 'boolean' | 'null' | 'json';

export interface JsonObjectRow {
  id: string;
  key: string;
  type: JsonFieldType;
  stringValue: string;
  numberValue: number | null;
  booleanValue: boolean;
  rawJsonValue: string;
}

@Component({
  selector: 'app-workflow-json-object-editor',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-json-object-editor.component.html',
  styleUrl: './workflow-json-object-editor.component.css',
})
export class WorkflowJsonObjectEditorComponent implements OnChanges {
  @Input() value: JsonValue = {};
  @Input() readonly = false;

  @Output() readonly valueChange = new EventEmitter<JsonValue>();

  readonly rows = signal<JsonObjectRow[]>([]);
  readonly rawJsonText = signal<string>('{}');
  readonly validationError = signal<string | null>(null);
  readonly advancedOpen = signal(false);

  readonly typeOptions: SelectOption[] = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Null', value: 'null' },
    { label: 'JSON', value: 'json' },
  ];

  readonly booleanOptions: SelectOption[] = [
    { label: 'true', value: true },
    { label: 'false', value: false },
  ];

  private rowIdCounter = 0;
  private syncing = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !this.syncing) {
      this.populateFromValue(this.value);
    }
  }

  addRow(): void {
    if (this.readonly) return;
    const newRow: JsonObjectRow = {
      id: `row-${++this.rowIdCounter}`,
      key: '',
      type: 'string',
      stringValue: '',
      numberValue: null,
      booleanValue: false,
      rawJsonValue: '',
    };
    this.rows.update((list) => [...list, newRow]);
    this.syncFromRows();
  }

  removeRow(rowId: string): void {
    if (this.readonly) return;
    this.rows.update((list) => list.filter((r) => r.id !== rowId));
    this.syncFromRows();
  }

  onKeyChange(rowId: string, newKey: string): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, key: newKey } : r)),
    );
    this.syncFromRows();
  }

  onTypeChange(rowId: string, newType: JsonFieldType): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          type: newType,
          stringValue: r.stringValue,
          numberValue: r.numberValue ?? (Number(r.stringValue) || 0),
          booleanValue: r.type === 'boolean' ? r.booleanValue : (r.stringValue === 'true'),
          rawJsonValue: r.rawJsonValue || (newType === 'json' ? '{}' : ''),
        };
      }),
    );
    this.syncFromRows();
  }

  onStringValueChange(rowId: string, newValue: string): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, stringValue: newValue } : r)),
    );
    this.syncFromRows();
  }

  onNumberValueChange(rowId: string, newValue: number | null): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, numberValue: newValue, stringValue: newValue != null ? String(newValue) : '' } : r)),
    );
    this.syncFromRows();
  }

  onBooleanValueChange(rowId: string, newValue: boolean): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, booleanValue: newValue } : r)),
    );
    this.syncFromRows();
  }

  onRawJsonValueChange(rowId: string, newValue: string): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, rawJsonValue: newValue } : r)),
    );
    this.syncFromRows();
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((open) => !open);
  }

  onRawJsonChange(text: string): void {
    if (this.readonly) return;
    this.rawJsonText.set(text);

    const trimmed = text.trim();
    if (!trimmed) {
      this.validationError.set(null);
      this.rows.set([]);
      this.emitValue({});
      return;
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        this.validationError.set('workflowStudio.inspector.invalidCriteriaJson');
        return;
      }

      this.validationError.set(null);
      this.populateFromValue(parsed as Record<string, JsonValue>);
      this.emitValue(parsed as Record<string, JsonValue>);
    } catch {
      this.validationError.set('workflowStudio.inspector.invalidCriteriaJson');
    }
  }

  private populateFromValue(val: JsonValue | null | undefined): void {
    const obj = (val && typeof val === 'object' && !Array.isArray(val))
      ? val as Record<string, JsonValue>
      : {};

    const nextRows: JsonObjectRow[] = Object.entries(obj).map(([k, v]) => {
      const type = inferFieldType(v);
      return {
        id: `row-${++this.rowIdCounter}`,
        key: k,
        type,
        stringValue: typeof v === 'string' ? v : (type === 'number' ? String(v) : ''),
        numberValue: typeof v === 'number' ? v : null,
        booleanValue: typeof v === 'boolean' ? v : false,
        rawJsonValue: type === 'json' ? JSON.stringify(v, null, 2) : (v === null ? 'null' : String(v ?? '')),
      };
    });

    this.rows.set(nextRows);
    this.rawJsonText.set(JSON.stringify(val ?? {}, null, 2));
    this.validationError.set(null);
  }

  private syncFromRows(): void {
    const currentRows = this.rows();

    if (currentRows.length === 0) {
      this.validationError.set(null);
      const emptyVal: Record<string, JsonValue> = {};
      this.rawJsonText.set('{}');
      this.emitValue(emptyVal);
      return;
    }

    const seenKeys = new Set<string>();
    for (const r of currentRows) {
      const trimmedKey = r.key.trim();
      if (!trimmedKey) {
        this.validationError.set('workflowStudio.inspector.emptyCriteriaKey');
        return;
      }
      if (seenKeys.has(trimmedKey)) {
        this.validationError.set('workflowStudio.inspector.duplicateCriteriaKey');
        return;
      }
      seenKeys.add(trimmedKey);
    }

    const nextObj: Record<string, JsonValue> = {};
    for (const r of currentRows) {
      const trimmedKey = r.key.trim();
      switch (r.type) {
        case 'string':
          nextObj[trimmedKey] = r.stringValue ?? '';
          break;
        case 'number': {
          const num = r.numberValue != null ? r.numberValue : Number(r.stringValue);
          nextObj[trimmedKey] = Number.isFinite(num) ? num : 0;
          break;
        }
        case 'boolean':
          nextObj[trimmedKey] = Boolean(r.booleanValue);
          break;
        case 'null':
          nextObj[trimmedKey] = null;
          break;
        case 'json': {
          const raw = (r.rawJsonValue ?? '').trim();
          if (!raw) {
            nextObj[trimmedKey] = {};
          } else {
            try {
              nextObj[trimmedKey] = JSON.parse(raw) as JsonValue;
            } catch {
              this.validationError.set('workflowStudio.inspector.invalidCriteriaJson');
              return;
            }
          }
          break;
        }
      }
    }

    this.validationError.set(null);
    this.rawJsonText.set(JSON.stringify(nextObj, null, 2));
    this.emitValue(nextObj);
  }

  private emitValue(nextVal: JsonValue): void {
    this.syncing = true;
    try {
      this.valueChange.emit(nextVal);
    } finally {
      this.syncing = false;
    }
  }
}

function inferFieldType(value: JsonValue): JsonFieldType {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'json';
}