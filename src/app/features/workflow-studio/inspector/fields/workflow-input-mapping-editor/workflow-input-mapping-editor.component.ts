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

import { InputMapping, JsonValue } from '../../../model/workflow-studio.model';

export interface MappingRow {
  id: string;
  key: string;
  value: string;
}

@Component({
  selector: 'app-workflow-input-mapping-editor',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-input-mapping-editor.component.html',
  styleUrl: './workflow-input-mapping-editor.component.css',
})
export class WorkflowInputMappingEditorComponent implements OnChanges {
  @Input() value: InputMapping = { mapping: {} };
  @Input() readonly = false;

  @Output() readonly valueChange = new EventEmitter<InputMapping>();

  readonly rows = signal<MappingRow[]>([]);
  readonly rawJsonText = signal<string>('{\n  "mapping": {}\n}');
  readonly validationError = signal<string | null>(null);
  readonly advancedOpen = signal(false);

  private rowIdCounter = 0;
  private syncing = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !this.syncing) {
      this.populateFromValue(this.value);
    }
  }

  addRow(): void {
    if (this.readonly) return;
    const newRow: MappingRow = {
      id: `row-${++this.rowIdCounter}`,
      key: '',
      value: '',
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

  onValueChange(rowId: string, newValue: string): void {
    if (this.readonly) return;
    this.rows.update((list) =>
      list.map((r) => (r.id === rowId ? { ...r, value: newValue } : r)),
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
      this.emitValue({ mapping: {} });
      return;
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        this.validationError.set('workflowStudio.inspector.invalidMappingJson');
        return;
      }

      const mappingObj = ('mapping' in parsed && typeof (parsed as Record<string, unknown>)['mapping'] === 'object' && !Array.isArray((parsed as Record<string, unknown>)['mapping']) && (parsed as Record<string, unknown>)['mapping'] !== null)
        ? (parsed as Record<string, Record<string, unknown>>)['mapping']
        : parsed as Record<string, unknown>;

      const nextRows: MappingRow[] = Object.entries(mappingObj).map(([k, v]) => ({
        id: `row-${++this.rowIdCounter}`,
        key: k,
        value: typeof v === 'string' ? v : JSON.stringify(v),
      }));

      this.validationError.set(null);
      this.rows.set(nextRows);
      this.emitValue({ mapping: mappingObj as Record<string, JsonValue> });
    } catch {
      this.validationError.set('workflowStudio.inspector.invalidMappingJson');
    }
  }

  private populateFromValue(val: InputMapping | null | undefined): void {
    const mapping = (val && typeof val === 'object' && 'mapping' in val && typeof val.mapping === 'object' && val.mapping !== null)
      ? val.mapping as Record<string, JsonValue>
      : {};

    const nextRows: MappingRow[] = Object.entries(mapping).map(([k, v]) => ({
      id: `row-${++this.rowIdCounter}`,
      key: k,
      value: typeof v === 'string' ? v : JSON.stringify(v),
    }));

    this.rows.set(nextRows);
    this.rawJsonText.set(JSON.stringify(val ?? { mapping: {} }, null, 2));
    this.validationError.set(null);
  }

  private syncFromRows(): void {
    const currentRows = this.rows();

    if (currentRows.length === 0) {
      this.validationError.set(null);
      const emptyVal: InputMapping = { mapping: {} };
      this.rawJsonText.set(JSON.stringify(emptyVal, null, 2));
      this.emitValue(emptyVal);
      return;
    }

    const seenKeys = new Set<string>();
    for (const r of currentRows) {
      const trimmedKey = r.key.trim();
      if (!trimmedKey) {
        this.validationError.set('workflowStudio.inspector.emptyMappingKey');
        return;
      }
      if (seenKeys.has(trimmedKey)) {
        this.validationError.set('workflowStudio.inspector.duplicateMappingKey');
        return;
      }
      seenKeys.add(trimmedKey);
    }

    this.validationError.set(null);
    const mappingRecord: Record<string, JsonValue> = {};
    for (const r of currentRows) {
      mappingRecord[r.key.trim()] = toJsonValueOrString(r.value);
    }

    const nextVal: InputMapping = { mapping: mappingRecord };
    this.rawJsonText.set(JSON.stringify(nextVal, null, 2));
    this.emitValue(nextVal);
  }

  private emitValue(nextVal: InputMapping): void {
    this.syncing = true;
    try {
      this.valueChange.emit(nextVal);
    } finally {
      this.syncing = false;
    }
  }
}

function toJsonValueOrString(value: string): JsonValue {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('${') && trimmed.endsWith('}')) {
    return trimmed;
  }
  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    return trimmed;
  }
}
