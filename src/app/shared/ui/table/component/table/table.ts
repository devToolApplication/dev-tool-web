import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef, signal } from '@angular/core';
import { PermissionService } from '../../../../../core/auth/permission.service';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import {
  TableAction,
  TableBulkAction,
  TableConfig,
  TableDensity,
  TableExportScope,
  TableToolbarButtonConfig,
  TableToolbarConfig,
  TableToolbarExportConfig,
  TableToolbarImportConfig
} from '../../models/table-config.model';
import { SelectOption } from '../../../../component/select/select';
import { ConfirmDialogService } from '../../../overlay/confirm-dialog/confirm-dialog.service';
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

export interface TableExportEvent {
  scope: TableExportScope;
  filters: Record<string, any>;
  sortField: string | null;
  sortOrder: 1 | -1 | 0;
  visibleColumns: string[];
  rows: any[];
}

export interface TableCellTemplateContext {
  $implicit: any;
  row: any;
  value: unknown;
  column: unknown;
}

@Component({
  selector: 'app-table',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.html',
  styleUrls: ['./table.css']
})
export class TableComponent implements OnChanges {
  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() pageResponse: BasePageResponse<any> | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() totalRecords: number | null = null;
  @Input() currentPage = 0;
  @Input() rows = 10;
  @Input() sortField: string | null = null;
  @Input() sortOrder: 1 | -1 | 0 = 0;
  @Input() customTemplates: Record<string, TemplateRef<TableCellTemplateContext>> = {};

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() export = new EventEmitter<TableExportEvent>();
  @Output() import = new EventEmitter<File>();
  @Output() pageChange = new EventEmitter<TablePageChangeEvent>();
  @Output() retry = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() densityChange = new EventEmitter<TableDensity>();
  @Output() columnVisibilityChange = new EventEmitter<string[]>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: TableAction; row: any }>();
  @Output() sortChange = new EventEmitter<TableSortChangeEvent>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() bulkAction = new EventEmitter<{ action: TableBulkAction; rows: any[] }>();

  readonly quickSearchTerm = signal('');
  readonly selectedColumnFields = signal<string[]>([]);
  readonly density = signal<TableDensity>('comfortable');
  readonly selectedRows = signal<any[]>([]);
  readonly selectedRowKeys = signal<string[]>([]);
  readonly activeFilterCount = signal(0);
  readonly activeFilters = signal<Record<string, any>>({});
  private readonly selectedRowCache = new Map<string, any>();

  readonly densityOptions: SelectOption[] = [
    { label: 'shared.table.density.compact', value: 'compact' },
    { label: 'shared.table.density.comfortable', value: 'comfortable' },
    { label: 'shared.table.density.spacious', value: 'spacious' }
  ];

  constructor(
    private readonly i18nService: I18nService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly permissionService: PermissionService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      const persistedState = this.readPersistedState();
      this.selectedColumnFields.set(persistedState?.columns ?? this.defaultColumnFields());
      this.density.set(persistedState?.density ?? this.config.density ?? 'comfortable');
    }

    if (changes['data'] || changes['pageResponse']) {
      this.syncSelectedRowsFromKeys();
    }
  }

  get toolbarConfig(): TableToolbarConfig {
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
    return this.exportButtonConfig.scope ?? (this.exportButtonConfig.currentData ? 'current-page' : 'external');
  }

  get exportButtonLabel(): string {
    return this.exportButtonConfig.label ?? (this.exportScope === 'current-page' ? 'shared.table.exportCurrentPage' : 'shared.table.exportFiltered');
  }

  get exportButtonIcon(): string {
    return this.exportButtonConfig.icon ?? 'pi pi-download';
  }

  get refreshButtonConfig(): TableToolbarButtonConfig {
    return this.toolbarConfig.refresh ?? {};
  }

  get scrollable(): boolean {
    return this.config.scrollable ?? true;
  }

  get resolvedRows(): number {
    if (this.pageResponse?.metadata?.pageSize != null) {
      return this.pageResponse.metadata.pageSize;
    }
    return this.rows || this.config.rows || 10;
  }

  get resolvedTotalRecords(): number {
    if (this.pageResponse?.metadata?.totalElements != null) {
      return this.pageResponse.metadata.totalElements;
    }
    return this.totalRecords ?? this.data.length;
  }

  get first(): number {
    return this.resolvedCurrentPage * this.resolvedRows;
  }

  get resolvedCurrentPage(): number {
    if (this.pageResponse?.metadata?.pageNumber != null) {
      return this.pageResponse.metadata.pageNumber;
    }
    return this.currentPage;
  }

  get resolvedData(): any[] {
    return this.pageResponse?.data ?? this.data;
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

  get visibleBulkActions(): TableBulkAction[] {
    return (this.toolbarConfig.bulkActions ?? []).filter((action) => (action.visible ?? true) && this.canRenderAction(action));
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
        value: column.field
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
    return this.pageResponse !== null || this.totalRecords !== null;
  }

  get scrollHeight(): string {
    return this.config.scrollHeight ?? 'flex';
  }

  get tableMinWidth(): string {
    return this.config.minWidth ?? '75rem';
  }

  isButtonVisible(buttonConfig?: TableToolbarButtonConfig): boolean {
    return buttonConfig?.visible === true && this.canRenderToolbarButton(buttonConfig);
  }

  isButtonDisabled(buttonConfig?: TableToolbarButtonConfig): boolean {
    return (buttonConfig?.disabled ?? false) || !this.hasToolbarButtonPermission(buttonConfig);
  }

  buttonTooltip(buttonConfig?: TableToolbarButtonConfig): string | undefined {
    if (!this.hasToolbarButtonPermission(buttonConfig)) {
      return buttonConfig?.permissionDeniedTooltip ?? 'shared.permission.deniedAction';
    }

    return undefined;
  }

  isBulkActionDisabled(action: TableBulkAction): boolean {
    return action.disabled === true || !this.hasActionPermission(action);
  }

  bulkActionTooltip(action: TableBulkAction): string | undefined {
    if (!this.hasActionPermission(action)) {
      return action.permissionDeniedTooltip ?? 'shared.permission.deniedAction';
    }

    return action.tooltip;
  }

  onCreate(): void {
    this.create.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onExport(): void {
    if (this.exportScope === 'current-page') {
      this.downloadCsv();
      return;
    }

    this.export.emit({
      scope: this.exportScope,
      filters: this.activeFilters(),
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      visibleColumns: this.visibleColumns.filter((column) => column.type !== 'actions').map((column) => column.field),
      rows: this.resolvedData
    });
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
      first
    });
  }

  onSort(event: { field?: string; order?: 1 | -1 | 0 }): void {
    this.sortChange.emit({
      field: event.field,
      order: event.order
    });
  }

  onSearch(filters: Record<string, any>): void {
    if (this.loading) {
      return;
    }
    this.activeFilters.set({ ...filters });
    this.activeFilterCount.set(this.countActiveFilters(filters));
    this.search.emit(filters);
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

  onColumnFieldsChange(fields: string[] | null): void {
    const nextFields = fields ?? [];
    this.selectedColumnFields.set(nextFields);
    this.persistState();
    this.columnVisibilityChange.emit(nextFields);
  }

  onDensityChange(value: string | number | boolean | null): void {
    if (value !== 'compact' && value !== 'comfortable' && value !== 'spacious') {
      return;
    }
    this.density.set(value);
    this.persistState();
    this.densityChange.emit(value);
  }

  onRowClick(row: any): void {
    if (this.config.rowClickable) {
      this.rowClick.emit(row);
    }
  }

  isRowSelected(row: any): boolean {
    return this.selectedRowKeys().includes(this.rowKey(row));
  }

  toggleRowSelection(row: any, selected: boolean | null): void {
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

  async onBulkAction(action: TableBulkAction): Promise<void> {
    if (this.isBulkActionDisabled(action) || this.selectedCount === 0) {
      return;
    }

    const confirmConfig = action.confirm ?? this.defaultDangerConfirm(action);
    if (confirmConfig) {
      const confirmed = await this.confirmDialogService.confirm({
        title: confirmConfig.title,
        message: confirmConfig.message,
        confirmText: confirmConfig.confirmText,
        cancelText: confirmConfig.cancelText,
        variant: confirmConfig.variant ?? (action.variant === 'danger' ? 'danger' : 'warning')
      });

      if (!confirmed) {
        return;
      }
    }

    const rows = this.selectedRows();
    action.onClick?.(rows);
    this.bulkAction.emit({ action, rows });
  }

  onActionClick(event: { action: TableAction; row: any }): void {
    event.action.onClick?.(event.row);
    this.actionClick.emit(event);
  }

  private downloadCsv(): void {
    const columns = this.visibleColumns.filter((column) => column.type !== 'actions');
    const header = columns.map((column) => this.escapeCsv(this.i18nService.t(column.header))).join(',');
    const lines = this.resolvedData.map((row) =>
      columns
        .map((column) => {
          const value = column.valueGetter ? column.valueGetter(row) : getValueByPath(row, column.field);
          return this.escapeCsv(this.formatCsvValue(value));
        })
        .join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.exportButtonConfig.fileName ?? 'table-export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    const escaped = value.replaceAll('"', '""');
    return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
  }

  private formatCsvValue(value: unknown): string {
    if (value == null) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private defaultDangerConfirm(action: TableBulkAction): TableBulkAction['confirm'] | null {
    if (action.variant !== 'danger' && action.severity !== 'danger') {
      return null;
    }

    return {
      message: 'shared.confirm.dangerAction',
      variant: 'danger'
    };
  }

  private defaultColumnFields(): string[] {
    return this.config.columns
      .filter((column) => column.visible !== false && column.hideable !== false)
      .map((column) => column.field);
  }

  private countActiveFilters(filters: Record<string, any>): number {
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

  private readPersistedState(): { columns?: string[]; density?: TableDensity } | null {
    if (!this.config.stateKey || typeof localStorage === 'undefined') {
      return null;
    }

    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as { columns?: unknown; density?: unknown };
      const columns = Array.isArray(parsedValue.columns)
        ? parsedValue.columns.filter((field): field is string => typeof field === 'string')
        : undefined;
      const density = this.isTableDensity(parsedValue.density) ? parsedValue.density : undefined;

      return { columns, density };
    } catch {
      return null;
    }
  }

  private persistState(): void {
    if (!this.config.stateKey || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify({
        columns: this.selectedColumnFields(),
        density: this.density()
      })
    );
  }

  private get storageKey(): string {
    return `dev-tool.table.${this.config.stateKey}`;
  }

  private isTableDensity(value: unknown): value is TableDensity {
    return value === 'compact' || value === 'comfortable' || value === 'spacious';
  }

  private canRenderToolbarButton(buttonConfig?: TableToolbarButtonConfig): boolean {
    if (buttonConfig?.permissionMode === 'hide' && !this.hasToolbarButtonPermission(buttonConfig)) {
      return false;
    }

    return true;
  }

  private canRenderAction(action: TableBulkAction): boolean {
    if (action.permissionMode === 'hide' && !this.hasActionPermission(action)) {
      return false;
    }

    return true;
  }

  private hasToolbarButtonPermission(buttonConfig?: TableToolbarButtonConfig): boolean {
    return !buttonConfig?.permissions?.length || this.permissionService.hasAll(buttonConfig.permissions);
  }

  private hasActionPermission(action: TableBulkAction): boolean {
    return !action.permissions?.length || this.permissionService.hasAll(action.permissions);
  }

  private rowKey(row: any): string {
    const configuredKey = this.config.rowKey ?? this.config.dataKey;
    const rawKey =
      typeof configuredKey === 'function'
        ? configuredKey(row)
        : configuredKey
          ? getValueByPath(row, configuredKey)
          : row?.id ?? row?._id ?? row?.uuid;
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
        .filter((row) => row !== undefined)
    );
  }
}
