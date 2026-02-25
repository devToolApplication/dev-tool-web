import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableConfig, TableToolbarButtonConfig, TableToolbarConfig, TableToolbarImportConfig } from './models/table-config.model';

@Component({
  selector: 'app-table',
  standalone: false,
  templateUrl: './table.html',
  styleUrls: ['./table.css']
})
export class TableComponent {
  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() loading = false;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() create = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() import = new EventEmitter<File>();

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

  onSearch(filters: Record<string, any>): void {
    this.search.emit(filters);
  }

  onResetFilter(): void {
    this.resetFilter.emit();
  }
}
