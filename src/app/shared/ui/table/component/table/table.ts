import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { TableConfig, TableToolbarButtonConfig, TableToolbarConfig, TableToolbarImportConfig } from '../../models/table-config.model';

export interface TablePageChangeEvent {
  page: number;
  rows: number;
  first: number;
}

@Component({
  selector: 'app-table',
  standalone: false,
  templateUrl: './table.html',
  styleUrls: ['./table.css']
})
export class TableComponent {
  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() pageResponse: BasePageResponse<any> | null = null;
  @Input() loading = false;
  @Input() totalRecords: number | null = null;
  @Input() currentPage = 0;
  @Input() rows = 10;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() import = new EventEmitter<File>();
  @Output() pageChange = new EventEmitter<TablePageChangeEvent>();

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

  get exportButtonConfig(): TableToolbarButtonConfig {
    return this.toolbarConfig.export ?? {};
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
    return buttonConfig?.visible === true;
  }

  onCreate(): void {
    this.create.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onExport(): void {
    this.export.emit();
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

  onSearch(filters: Record<string, any>): void {
    if (this.loading) {
      return;
    }
    this.search.emit(filters);
  }

  onResetFilter(): void {
    this.resetFilter.emit();
  }
}
