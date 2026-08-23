import type { OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '@core/i18n/i18n.service';
import type {
  TableAction,
  TableBulkAction,
  TableCellTemplateContext,
  TableColumn,
  TableConfig,
  TableDensity,
  TableExportRequest,
  TableExportScope,
  TableFilterValue,
  TableToolbarButtonConfig,
  TableToolbarConfig,
  TableToolbarExportConfig,
  TableToolbarImportConfig,
} from '../../models/table-config.model';
import type { SelectOption } from '@shared/ui/primitives/select/select';

import { getValueByPath } from '../../utils/object.util';

export interface TablePageChangeEvent {
  page: number;
  rows: number;
  first: number;
}

export interface TableSortChangeEvent {
  field?: string;
  order?: 1 | -1 | 0;
}

@Component({
  selector: 'app-table',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.html',
  styleUrls: ['./table.css'],
})
export class TableComponent<TRow = unknown> implements OnChanges {
  private readonly i18nService = inject(I18nService);

  @Input() config!: TableConfig<TRow>;
  @Input() data: TRow[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() totalRecords: number | null = null;
  @Input() currentPage = 0;
  @Input() rows = 10;
  @Input() sortField: string | null = null;
  @Input() sortOrder: 1 | -1 | 0 = 0;
  @Input() customTemplates: Record<string, TemplateRef<TableCellTemplateContext<TRow>>> = {};
  @Input() columnVisibility: string[] | null = null;
  @Input() densityValue: TableDensity | null = null;

  @Output() search = new EventEmitter<TableFilterValue>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() exportRequested = new EventEmitter<TableExportRequest<TRow>>();
  @Output() import = new EventEmitter<File>();
  @Output() pageChange = new EventEmitter<TablePageChangeEvent>();
  @Output() retry = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() densityChange = new EventEmitter<TableDensity>();
  @Output() columnVisibilityChange = new EventEmitter<string[]>();
  @Output() rowClick = new EventEmitter<TRow>();
  @Output() actionClick = new EventEmitter<{ action: TableAction<TRow>; row: TRow }>();
  @Output() sortChange = new EventEmitter<TableSortChangeEvent>();
  @Output() selectionChange = new EventEmitter<TRow[]>();
  @Output() bulkAction = new EventEmitter<{ action: TableBulkAction<TRow>; rows: TRow[] }>();

  readonly quickSearchTerm = signal('');
  readonly selectedColumnFields = signal<string[]>([]);
  readonly density = signal<TableDensity>('comfortable');
  readonly selectedRows = signal<TRow[]>([]);
  readonly selectedRowKeys = signal<string[]>([]);
  readonly activeFilterCount = signal(0);
  readonly activeFilters = signal<TableFilterValue>({});
  private readonly selectedRowCache = new Map<string, TRow>();

  readonly densityOptions: SelectOption[] = [
    { label: 'shared.table.density.compact', value: 'compact' },
    { label: 'shared.table.density.comfortable', value: 'comfortable' },
    { label: 'shared.table.density.spacious', value: 'spacious' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.selectedColumnFields.set(this.columnVisibility ?? this.defaultColumnFields());
      this.density.set(this.densityValue ?? this.config.density ?? 'comfortable');
    }

    if (changes['columnVisibility'] && this.columnVisibility) {
      this.selectedColumnFields.set(this.columnVisibility);
    }

    if (changes['densityValue'] && this.densityValue) {
      this.density.set(this.densityValue);
    }

    if (changes['data'] || changes['pageResponse']) {
      this.syncSelectedRowsFromKeys();
    }
  }

  get toolbarConfig(): TableToolbarConfig<TRow> {
    return this.config.toolbar ?? {};
  }

  get newButtonConfig(): TableToolbarButtonConfig {
    return this.toolbarConfig.new ?? {};
  }

  get deleteButtonConfig(): TableToolbarButtonConfig {
    return this.toolbarConfig.delete ?? {};
  }

  get importButtonConfig(): TableToolbarImportConfig {
    return this.toolbarConfig.import ?? {};
  }

  get exportButtonConfig(): TableToolbarExportConfig {
    return this.toolbarConfig.export ?? {};
  }

  get exportScope(): TableExportScope {
    return (
      this.exportButtonConfig.scope ??
      (this.exportButtonConfig.currentData ? 'current-page' : 'external')
    );
  }

  get exportButtonLabel(): string {
    return (
      this.exportButtonConfig.label ??
      (this.exportScope === 'current-page'
        ? 'shared.table.exportCurrentPage'
        : 'shared.table.exportFiltered')
    );
  }

  get exportButtonIcon(): string {
    return this.exportButtonConfig.icon ?? 'pi pi-download';
  }

  get refreshButtonConfig(): TableToolbarButtonConfig {
    return this.toolbarConfig.refresh ?? {};
  }

  get hasToolbarContent(): boolean {
    return (
      this.isButtonVisible(this.newButtonConfig) ||
      this.isButtonVisible(this.deleteButtonConfig) ||
      this.toolbarConfig.search?.visible === true ||
      (this.selectionEnabled && this.visibleBulkActions.length > 0) ||
      this.isButtonVisible(this.refreshButtonConfig) ||
      this.toolbarConfig.columnVisibility?.visible === true ||
      this.toolbarConfig.density?.visible === true ||
      this.isButtonVisible(this.importButtonConfig) ||
      this.isButtonVisible(this.exportButtonConfig)
    );
  }

  get scrollable(): boolean {
    return this.config.scrollable ?? true;
  }

  get resolvedRows(): number {
    return this.rows || this.config.rows || 10;
  }

  get resolvedTotalRecords(): number {
    return this.totalRecords ?? this.data.length;
  }

  get first(): number {
    return this.resolvedCurrentPage * this.resolvedRows;
  }

  get resolvedCurrentPage(): number {
    return this.currentPage;
  }

  get resolvedData(): TRow[] {
    return this.data;
  }

  get visibleColumns() {
    const selected = new Set(this.selectedColumnFields());
    return this.config.columns.filter((column) => {
      if (column.visible === false) {
        return false;
      }
      if (column.hideable === false) {
        return true;
      }
      return selected.has(column.field);
    });
  }

  get selectionEnabled(): boolean {
    return !!this.config.selection;
  }

  get multipleSelection(): boolean {
    return this.config.selection?.mode === 'multiple';
  }

  get selectedCount(): number {
    return this.selectedRowKeys().length;
  }

  get visibleBulkActions(): TableBulkAction<TRow>[] {
    return (this.toolbarConfig.bulkActions ?? []).filter((action) => action.visible ?? true);
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount() > 0;
  }

  get resolvedEmptyTitle(): string {
    if (this.hasActiveFilters) {
      return this.config.emptyFilteredTitle ?? 'shared.table.noResultsTitle';
    }

    return this.config.emptyTitle ?? 'shared.table.emptyTitle';
  }

  get resolvedEmptyDescription(): string {
    if (this.hasActiveFilters) {
      return this.config.emptyFilteredDescription ?? 'shared.table.noResultsDescription';
    }

    return this.config.emptyDescription ?? 'shared.table.emptyDescription';
  }

  get allCurrentRowsSelected(): boolean {
    const rows = this.resolvedData;
    return rows.length > 0 && rows.every((row) => this.isRowSelected(row));
  }

  get columnOptions(): SelectOption[] {
    return this.config.columns
      .filter((column) => column.visible !== false && column.hideable !== false)
      .map((column) => ({
        label: this.i18nService.t(column.header),
        value: column.field,
      }));
  }

  get tableStyleClass(): string {
    const classes = ['app-table-scrollable', `app-table-density--${this.density()}`];
    if (this.config.filters?.length) {
      classes.push('app-table-scrollable--with-filters');
    }
    if (this.config.rowClickable) {
      classes.push('app-table--row-clickable');
    }
    return classes.join(' ');
  }

  get serverSidePagination(): boolean {
    return this.totalRecords !== null;
  }

  get scrollHeight(): string {
    return this.config.scrollHeight ?? 'flex';
  }

  get tableMinWidth(): string {
    return this.config.minWidth ?? '64rem';
  }

  isFrozenLeft(column: TableColumn<TRow>): boolean {
    return column.frozen === true && this.frozenAlign(column) === 'left';
  }

  isFrozenRight(column: TableColumn<TRow>): boolean {
    return column.frozen === true && this.frozenAlign(column) === 'right';
  }

  frozenLeft(column: TableColumn<TRow>): string | null {
    return this.isFrozenLeft(column) ? this.frozenOffset(column, 'left') : null;
  }

  frozenRight(column: TableColumn<TRow>): string | null {
    return this.isFrozenRight(column) ? this.frozenOffset(column, 'right') : null;
  }

  isButtonVisible(buttonConfig?: TableToolbarButtonConfig): boolean {
    return buttonConfig?.visible === true;
  }

  isButtonDisabled(buttonConfig?: TableToolbarButtonConfig): boolean {
    return buttonConfig?.disabled ?? false;
  }

  buttonTooltip(buttonConfig?: TableToolbarButtonConfig): string | undefined {
    return buttonConfig?.tooltip;
  }

  isBulkActionDisabled(action: TableBulkAction<TRow>): boolean {
    return action.disabled === true;
  }

  bulkActionTooltip(action: TableBulkAction<TRow>): string | undefined {
    return action.tooltip;
  }

  onCreate(): void {
    this.create.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onExport(): void {
    const request: TableExportRequest<TRow> = {
      scope: this.exportScope,
      filters: this.activeFilters(),
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      visibleColumns: this.visibleColumns
        .filter((column) => column.type !== 'actions')
        .map((column) => column.field),
      rows: this.resolvedData,
    };

    this.exportRequested.emit(request);
  }

  onRefresh(): void {
    if (!this.loading) {
      this.refresh.emit();
    }
  }

  onImport(file: File | null | undefined): void {
    if (file) {
      this.import.emit(file);
    }
  }

  onPage(event: { page?: number; rows?: number; first?: number }): void {
    const rows = event.rows ?? this.resolvedRows;
    const first = event.first ?? 0;
    const page = event.page ?? (rows > 0 ? Math.floor(first / rows) : 0);

    this.pageChange.emit({
      page,
      rows,
      first,
    });
  }

  onSort(event: { field?: string; order?: 1 | -1 | 0 }): void {
    this.sortChange.emit({
      field: event.field,
      order: event.order,
    });
  }

  onSortColumn(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 1 ? -1 : this.sortOrder === -1 ? 0 : 1;
    } else {
      this.sortField = field;
      this.sortOrder = 1;
    }
    if (this.sortOrder === 0) {
      this.sortField = null;
    }
    this.onSort({ field: this.sortField ?? undefined, order: this.sortOrder });
  }

  onSearch(filters: TableFilterValue): void {
    if (this.loading) {
      return;
    }
    this.onFilterValueChange(filters);
    this.search.emit(filters);
  }

  onFilterValueChange(filters: TableFilterValue): void {
    this.activeFilters.set({ ...filters });
    this.activeFilterCount.set(this.countActiveFilters(filters));
  }

  onQuickSearch(): void {
    const searchConfig = this.toolbarConfig.search ?? {};
    const field = searchConfig.field ?? 'keyword';
    this.onSearch({ [field]: this.quickSearchTerm().trim() });
  }

  onResetFilter(): void {
    this.activeFilters.set({});
    this.activeFilterCount.set(0);
    this.resetFilter.emit();
  }

  onColumnFieldsChange(fields: Array<string | number> | null): void {
    const nextFields = (fields ?? []).filter((field): field is string => typeof field === 'string');
    this.selectedColumnFields.set(nextFields);
    this.columnVisibilityChange.emit(nextFields);
  }

  onDensityChange(value: string | number | boolean | null): void {
    if (value !== 'compact' && value !== 'comfortable' && value !== 'spacious') {
      return;
    }
    this.density.set(value);
    this.densityChange.emit(value);
  }

  onRowClick(row: TRow): void {
    if (this.config.rowClickable) {
      this.rowClick.emit(row);
    }
  }

  isRowSelected(row: TRow): boolean {
    return this.selectedRowKeys().includes(this.rowKey(row));
  }

  toggleRowSelection(row: TRow, selected: boolean | null): void {
    if (!this.selectionEnabled) {
      return;
    }

    const key = this.rowKey(row);
    if (this.config.selection?.mode === 'single') {
      this.selectedRowKeys.set(selected ? [key] : []);
      if (selected) {
        this.selectedRowCache.set(key, row);
      } else {
        this.selectedRowCache.delete(key);
      }
      this.syncSelectedRowsFromKeys();
      this.selectionChange.emit(this.selectedRows());
      return;
    }

    const currentKeys = this.selectedRowKeys();
    const next = selected
      ? [...currentKeys, key].filter((item, index, items) => items.indexOf(item) === index)
      : currentKeys.filter((item) => item !== key);
    if (selected) {
      this.selectedRowCache.set(key, row);
    } else {
      this.selectedRowCache.delete(key);
    }
    this.selectedRowKeys.set(next);
    this.syncSelectedRowsFromKeys();
    this.selectionChange.emit(this.selectedRows());
  }

  toggleAllCurrentRows(selected: boolean | null): void {
    if (!this.multipleSelection) {
      return;
    }

    const rows = this.resolvedData;
    const currentKeys = this.selectedRowKeys();
    const rowKeys = rows.map((row) => this.rowKey(row));
    const next = selected
      ? [...currentKeys, ...rowKeys].filter((item, index, items) => items.indexOf(item) === index)
      : currentKeys.filter((item) => !rowKeys.includes(item));
    rows.forEach((row) => this.selectedRowCache.set(this.rowKey(row), row));
    if (!selected) {
      rowKeys.forEach((key) => this.selectedRowCache.delete(key));
    }
    this.selectedRowKeys.set(next);
    this.syncSelectedRowsFromKeys();
    this.selectionChange.emit(this.selectedRows());
  }

  async onBulkAction(action: TableBulkAction<TRow>): Promise<void> {
    if (this.isBulkActionDisabled(action) || this.selectedCount === 0) {
      return;
    }

    const rows = this.selectedRows();
    action.onClick?.(rows);
    this.bulkAction.emit({ action, rows });
  }

  onActionClick(event: { action: TableAction<TRow>; row: TRow }): void {
    event.action.onClick?.(event.row);
    this.actionClick.emit(event);
  }

  private defaultColumnFields(): string[] {
    return this.config.columns
      .filter((column) => column.visible !== false && column.hideable !== false)
      .map((column) => column.field);
  }

  private frozenAlign(column: TableColumn<TRow>): 'left' | 'right' {
    return column.alignFrozen ?? 'left';
  }

  private frozenOffset(column: TableColumn<TRow>, align: 'left' | 'right'): string {
    const columnIndex = this.visibleColumns.indexOf(column);
    if (columnIndex < 0) {
      return '0';
    }

    const offsetColumns =
      align === 'left'
        ? this.visibleColumns.slice(0, columnIndex)
        : this.visibleColumns.slice(columnIndex + 1);
    const sizes = offsetColumns
      .filter((item) => item.frozen === true && this.frozenAlign(item) === align)
      .map((item) => item.width ?? item.minWidth)
      .filter((size): size is string => !!size);

    if (sizes.length === 0) {
      return '0';
    }

    return sizes.length === 1 ? sizes[0] : `calc(${sizes.join(' + ')})`;
  }

  private countActiveFilters(filters: TableFilterValue): number {
    return Object.values(filters).filter((value) => this.hasFilterValue(value)).length;
  }

  private hasFilterValue(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some((item) => this.hasFilterValue(item));
    }

    return value !== null && value !== undefined && value !== '';
  }

  private rowKey(row: TRow): string {
    const configuredKey = this.config.rowKey ?? this.config.dataKey;
    const rawKey =
      typeof configuredKey === 'function'
        ? configuredKey(row)
        : configuredKey
          ? getValueByPath(row, configuredKey)
          : (getValueByPath(row, 'id') ??
            getValueByPath(row, '_id') ??
            getValueByPath(row, 'uuid'));
    if (rawKey !== undefined && rawKey !== null && rawKey !== '') {
      return String(rawKey);
    }
    return String(this.resolvedData.indexOf(row));
  }

  private syncSelectedRowsFromKeys(): void {
    this.resolvedData.forEach((row) => this.selectedRowCache.set(this.rowKey(row), row));
    this.selectedRows.set(
      this.selectedRowKeys()
        .map((key) => this.selectedRowCache.get(key))
        .filter((row) => row !== undefined),
    );
  }
}
