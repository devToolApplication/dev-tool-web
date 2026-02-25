import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BasePageResponse } from '../../core/models/base-response.model';
import { UploadStorageResponse } from '../../core/models/upload-storage.model';
import { LoadingService } from '../../core/ui-services/loading.service';
import { ToastService } from '../../core/ui-services/toast.service';
import { UploadStorageService } from '../../core/services/upload-storage.service';
import { TableConfig } from '../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-upload-storage-list',
  standalone: false,
  templateUrl: './upload-storage-list.component.html',
  styleUrl: './upload-storage-list.component.css'
})
export class UploadStorageListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Upload Storage - View',
    filters: [
      { field: 'name', label: 'Name', placeholder: 'Nhập tên storage', defaultVisible: true },
      {
        field: 'status',
        label: 'Status',
        type: 'select',
        defaultVisible: true,
        options: [
          { label: 'ACTIVE', value: 'ACTIVE' },
          { label: 'INACTIVE', value: 'INACTIVE' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      { field: 'defaultActive', label: 'Default', type: 'boolean' },
      { field: 'storageType', label: 'Storage Type', hidden: true }
    ],
    filterOptions: {
      defaultVisibleCount: 2
    },
    toolbar: {
      new: {
        visible: true,
        label: 'NEW',
        icon: 'pi pi-plus',
        severity: 'success'
      },
      delete: {
        visible: true,
        label: 'DELETE',
        icon: 'pi pi-trash',
        severity: 'danger'
      },
      import: {
        visible: true,
        label: 'IMPORT',
        chooseLabel: 'IMPORT',
        accept: '*/*',
        maxFileSize: 1000000
      },
      export: {
        visible: true,
        label: 'EXPORT',
        icon: 'pi pi-upload',
        severity: 'help'
      }
    },
    columns: [
      { field: 'id', header: 'ID', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'storageType', header: 'Storage Type' },
      { field: 'status', header: 'Status' },
      { field: 'defaultActive', header: 'Default', type: 'boolean' },
      { field: 'apiDomain', header: 'API Domain' },
      { field: 'apiPath', header: 'API Path' },
      {
        field: 'actions',
        header: 'Action',
        type: 'actions',
        actions: [
          {
            label: 'Sửa',
            icon: 'pi pi-pencil',
            severity: 'info',
            onClick: (row) => this.goEdit(row.id)
          },
          {
            label: 'Xóa',
            icon: 'pi pi-trash',
            severity: 'danger',
            disabled: () => this.loading,
            onClick: (row) => this.removeById(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50]
  };

  rows: UploadStorageResponse[] = [];
  tableLoading = false;
  loading = false;

  selectedStorageId: string | null = null;
  filters: Record<string, any> = {};

  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.tableLoading = true;

    this.loadingService
      .track(this.uploadStorageService.getPage(0, this.tableConfig.rows ?? 10, ['name,asc'], this.filters))
      .pipe(finalize(() => (this.tableLoading = false)))
      .subscribe({
        next: (res: BasePageResponse<UploadStorageResponse>) => {
          this.rows = res.data ?? [];
          if (this.selectedStorageId && !this.rows.some((row) => row.id === this.selectedStorageId)) {
            this.selectedStorageId = null;
          }
        },
        error: () => this.toastService.error('Tải danh sách upload storage thất bại')
      });
  }

  onSearch(filters: Record<string, any>): void {
    this.filters = filters;
    this.loadPage();
  }

  onResetFilter(): void {
    this.filters = {};
    this.loadPage();
  }

  goCreate(): void {
    void this.router.navigate(['/admin/upload-storage/storage/create']);
  }

  removeSelected(): void {
    if (!this.selectedStorageId) {
      this.toastService.info('Vui lòng chọn bản ghi cần xoá từ bảng');
      return;
    }

    this.removeById(this.selectedStorageId);
  }

  onCreate(): void {
    this.goCreate();
  }

  onDelete(): void {
    this.removeSelected();
  }

  onExport(): void {
    this.toastService.info('Tính năng export đang được phát triển');
  }

  onImport(file: File): void {
    this.toastService.info(`Đã chọn file import: ${file.name}`);
  }

  private goEdit(id: string): void {
    void this.router.navigate(['/admin/upload-storage/storage/edit', id]);
  }

  private removeById(id: string): void {
    this.loading = true;
    this.loadingService
      .track(this.uploadStorageService.delete(id))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.info('Đã xoá upload storage');
          if (this.selectedStorageId === id) {
            this.selectedStorageId = null;
          }
          this.loadPage();
        },
        error: () => this.toastService.error('Xoá upload storage thất bại')
      });
  }
}
