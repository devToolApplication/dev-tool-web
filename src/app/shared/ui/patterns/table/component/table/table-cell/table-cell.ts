import type { TemplateRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import type {
  TableAction,
  TableBadgeVariant,
  TableCellTemplateContext,
  TableColumn,
  TableRowLink,
} from '../../../models/table-config.model';
import { getValueByPath } from '../../../utils/object.util';

@Component({
  selector: 'app-table-cell',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-cell.html',
  styleUrls: ['./table-cell.css'],
})
export class TableCellComponent<TRow = unknown> {
  @Input() column!: TableColumn<TRow>;
  @Input() rowData!: TRow;
  @Input() customTemplates: Record<string, TemplateRef<TableCellTemplateContext<TRow>>> = {};
  @Output() actionClick = new EventEmitter<{ action: TableAction<TRow>; row: TRow }>();

  readonly jsonOpen = signal(false);
  readonly actionsOpen = signal(false);
  readonly actionMenuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];

  get value(): unknown {
    return this.column.valueGetter
      ? this.column.valueGetter(this.rowData)
      : getValueByPath(this.rowData, this.column.field);
  }

  get actions(): TableAction<TRow>[] {
    return (this.column.actions ?? []).filter((action) => action.visible?.(this.rowData) ?? true);
  }

  get primaryActions(): TableAction<TRow>[] {
    const explicitPrimary = this.actions.find((action) => action.placement === 'primary');
    const fallbackPrimary = this.actions.find((action) => action.placement !== 'more');
    const primary = explicitPrimary ?? fallbackPrimary;
    return primary ? [primary] : [];
  }

  get moreActions(): TableAction<TRow>[] {
    const primary = this.primaryActions[0];
    return this.actions.filter((action) => action !== primary);
  }

  get hasMoreActions(): boolean {
    return this.moreActions.length > 0;
  }

  get formattedValue(): string | number | null | undefined {
    return this.column.formatter?.(this.rowData, this.value);
  }

  get customTemplate(): TemplateRef<TableCellTemplateContext<TRow>> | null {
    return this.column.customTemplateKey
      ? (this.customTemplates[this.column.customTemplateKey] ?? null)
      : null;
  }

  get dateValue(): Date | null {
    return this.normalizeDateValue(this.value);
  }

  get badgeVariant(): TableBadgeVariant {
    const key = String(this.value ?? '');
    return this.column.badgeMap?.[key] ?? 'default';
  }

  get semanticClass(): string {
    const semantic =
      this.column.semanticFn?.(this.rowData, this.value) ?? this.defaultSemantic(this.value);
    return `table-cell-semantic table-cell-semantic--${semantic}`;
  }

  get linkTarget(): TableRowLink | null {
    if (!this.column.link) {
      return null;
    }
    return typeof this.column.link === 'function'
      ? this.column.link(this.rowData)
      : this.column.link;
  }

  get arrayValue(): unknown[] {
    return Array.isArray(this.value) ? Array.from(this.value as readonly unknown[]) : [];
  }

  get numericValue(): string | number | null {
    const value = this.value;
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  isActionDisabled(action: TableAction<TRow>): boolean {
    return action.disabled?.(this.rowData) ?? false;
  }

  actionTooltip(action: TableAction<TRow>): string {
    return action.tooltipFn?.(this.rowData) ?? action.tooltip ?? action.label;
  }

  actionVariant(action: TableAction<TRow>): 'primary' | 'secondary' | 'ghost' | 'destructive' {
    if (action.variant === 'danger' || action.severity === 'danger') return 'destructive';
    if (action.variant === 'primary' || action.severity === 'success') return 'primary';
    if (action.variant === 'ghost' || action.text) return 'ghost';
    return 'secondary';
  }

  actionSeverity(action: TableAction<TRow>) {
    if (action.severity !== undefined) {
      return action.severity;
    }
    switch (action.variant) {
      case 'primary':
        return 'info';
      case 'warning':
        return 'warn';
      case 'danger':
        return 'danger';
      case 'ghost':
      case 'default':
      default:
        return null;
    }
  }

  async onActionClick(action: TableAction<TRow>): Promise<void> {
    if (this.isActionDisabled(action)) {
      return;
    }

    this.closeActions();
    this.actionClick.emit({ action, row: this.rowData });
  }

  toggleActions(): void {
    if (this.actionsOpen()) {
      this.closeActions();
      return;
    }
    this.actionsOpen.set(true);
  }

  closeActions(): void {
    this.actionsOpen.set(false);
  }

  formatArrayValue(value: unknown): string {
    return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  }

  formatTextareaValue(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  formatJsonValue(value: unknown): string {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  formatNumber(value: unknown, fallbackFormat = '1.0-3'): string {
    return Number.isFinite(Number(value)) ? fallbackFormat : '';
  }

  formatDuration(value: unknown): string {
    const millis = Number(value);
    if (!Number.isFinite(millis)) {
      return String(value ?? '');
    }
    if (millis < 1000) {
      return `${millis} ms`;
    }
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  async copyValue(value: unknown = this.value): Promise<void> {
    const text = typeof value === 'string' ? value : this.formatJsonValue(value);
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      this.fallbackCopy(text);
    }
  }

  private defaultSemantic(value: unknown): 'positive' | 'negative' | 'neutral' {
    const numericValue = Number(value ?? 0);
    if (numericValue > 0) {
      return 'positive';
    }
    if (numericValue < 0) {
      return 'negative';
    }
    return 'neutral';
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private normalizeDateValue(value: unknown, depth = 0): Date | null {
    if (value == null || value === '' || depth > 3) {
      return null;
    }

    if (value instanceof Date) {
      return this.validDateOrNull(value);
    }

    if (typeof value === 'string') {
      const numericValue = Number(value);
      if (value.trim() !== '' && Number.isFinite(numericValue)) {
        return this.normalizeDateValue(numericValue, depth + 1);
      }

      return this.validDateOrNull(new Date(value));
    }

    if (typeof value === 'number') {
      const epochMillis = Math.abs(value) < 100000000000 ? value * 1000 : value;
      return this.validDateOrNull(new Date(epochMillis));
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const candidates = [
        record['$date'],
        record['$numberLong'],
        record['date'],
        record['value'],
        record['iso'],
        record['timestamp'],
        record['time'],
        record['epochMillis'],
      ];

      for (const candidate of candidates) {
        const normalized = this.normalizeDateValue(candidate, depth + 1);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  private validDateOrNull(value: Date): Date | null {
    return Number.isNaN(value.getTime()) ? null : value;
  }
}
