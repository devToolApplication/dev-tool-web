import {
  TableColumn,
  TableConfig,
  TableDensity,
  TableExportRequest,
  TableFilterField,
} from '@shared/ui/patterns/table';

export interface ServiceManagementTableViewState {
  columnVisibility: string[];
  density: TableDensity;
}

export interface ServiceManagementTableExportOptions {
  formatHeader?: (header: string) => string;
}

export function defaultTableColumnVisibility<TRow>(config: TableConfig<TRow>): string[] {
  return config.columns
    .filter((column) => column.visible !== false && column.hideable !== false)
    .map((column) => column.field);
}

export function readTableViewState<TRow>(
  key: string,
  config: TableConfig<TRow>,
): ServiceManagementTableViewState {
  const fallback: ServiceManagementTableViewState = {
    columnVisibility: defaultTableColumnVisibility(config),
    density: config.density ?? 'comfortable',
  };

  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ServiceManagementTableViewState>;
    return {
      columnVisibility: normalizeColumnVisibility(
        parsed.columnVisibility,
        fallback.columnVisibility,
      ),
      density: normalizeDensity(parsed.density, fallback.density),
    };
  } catch {
    return fallback;
  }
}

export function writeTableViewState(key: string, state: ServiceManagementTableViewState): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(key, JSON.stringify(state));
}

export function exportTableRequestAsCsv<TRow>(
  request: TableExportRequest<TRow>,
  config: TableConfig<TRow>,
  fileName: string,
  options: ServiceManagementTableExportOptions = {},
): void {
  const columns = request.visibleColumns
    .map((field) => config.columns.find((column) => column.field === field))
    .filter((column): column is TableColumn<TRow> => !!column && column.type !== 'actions');
  const header = columns
    .map((column) => escapeCsv(options.formatHeader?.(column.header) ?? column.header))
    .join(',');
  const rows = filterExportRows(request.rows, request.filters, config.filters ?? []);
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsv(formatCsvValue(readColumnValue(row, column)))).join(','),
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeColumnVisibility(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : fallback;
}

function normalizeDensity(value: unknown, fallback: TableDensity): TableDensity {
  return value === 'compact' || value === 'comfortable' || value === 'spacious' ? value : fallback;
}

function readColumnValue<TRow>(row: TRow, column: TableColumn<TRow>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }

  return String(column.field)
    .split('.')
    .reduce<unknown>((value, key) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[key];
      }
      return undefined;
    }, row);
}

function filterExportRows<TRow>(
  rows: TRow[],
  filters: Record<string, unknown>,
  filterFields: TableFilterField[],
): TRow[] {
  const activeFilters = Object.entries(filters).filter(([, value]) => hasFilterValue(value));

  if (!activeFilters.length) {
    return rows;
  }

  return rows.filter((row) =>
    activeFilters.every(([field, value]) =>
      matchesFilterValue(
        readRowValue(row, field),
        value,
        filterFields.find((item) => item.field === field),
      ),
    ),
  );
}

function readRowValue(row: unknown, field: string): unknown {
  return field
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((value, key) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[key];
      }
      return undefined;
    }, row);
}

function matchesFilterValue(
  rowValue: unknown,
  filterValue: unknown,
  field?: TableFilterField,
): boolean {
  if (!hasFilterValue(filterValue)) {
    return true;
  }

  if (Array.isArray(filterValue)) {
    return Array.isArray(rowValue)
      ? rowValue.some((item) => filterValue.includes(item))
      : filterValue.includes(rowValue);
  }

  if (isRangeValue(filterValue)) {
    return matchesRangeValue(rowValue, filterValue, field);
  }

  if (field?.type === 'text' || field?.type === 'autocomplete') {
    return String(rowValue ?? '')
      .toLowerCase()
      .includes(String(filterValue).trim().toLowerCase());
  }

  return rowValue === filterValue;
}

function matchesRangeValue(
  rowValue: unknown,
  filterValue: { start?: unknown; end?: unknown },
  field?: TableFilterField,
): boolean {
  const value = comparableFilterValue(rowValue, field);
  const start = hasFilterValue(filterValue.start)
    ? comparableFilterValue(filterValue.start, field)
    : null;
  const end = hasFilterValue(filterValue.end)
    ? comparableFilterValue(filterValue.end, field)
    : null;

  if (value === null || (start === null && end === null)) {
    return false;
  }

  return (start === null || value >= start) && (end === null || value <= end);
}

function comparableFilterValue(value: unknown, field?: TableFilterField): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (field?.type === 'date-range') {
    const time = Date.parse(String(value));
    return Number.isFinite(time) ? time : null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function isRangeValue(value: unknown): value is { start?: unknown; end?: unknown } {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('start' in value || 'end' in value)
  );
}

function hasFilterValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => hasFilterValue(item));
  }

  return value !== null && value !== undefined && value !== '';
}

function formatCsvValue(value: unknown): string {
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

function escapeCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
