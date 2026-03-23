import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { UploadStorageResponse } from '../../../../../core/models/file-storage/upload-storage.model';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-upload-storage-list',
  standalone: false,
  templateUrl: './upload-storage-list.component.html',
  styleUrl: './upload-storage-list.component.css'
})
export class UploadStorageListComponent implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'uploadStorage.viewTitle',
    filters: [
      { field: 'name', label: 'name', placeholder: 'uploadStorage.namePlaceholder' },
      {
        field: 'status',
        label: 'status',
        type: 'select',
        options: [
          { label: 'active', value: 'ACTIVE' },
          { label: 'inactive', value: 'INACTIVE' },
          { label: 'delete', value: 'DELETE' }
        ]
      },
      { field: 'defaultActive', label: 'default', type: 'boolean' },
      { field: 'storageType', label: 'storageType', hidden: true }
    ],
    filterOptions: {
      primaryField: 'name'
    },
    toolbar: {
      new: {
        visible: true,
        label: 'new',
        icon: 'pi pi-plus',
        severity: 'success'
      },
      delete: {
        visible: true,
        label: 'delete',
        icon: 'pi pi-trash',
        severity: 'danger'
      },
      import: {
        visible: true,
        label: 'import',
        chooseLabel: 'import',
        accept: '*/*',
        maxFileSize: 1000000
      },
      export: {
        visible: true,
        label: 'export',
        icon: 'pi pi-upload',
        severity: 'help'
      }
    },
    columns: [
      { field: 'id', header: 'id', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      { field: 'storageType', header: 'storageType' },
      { field: 'status', header: 'status' },
      { field: 'defaultActive', header: 'default', type: 'boolean' },
      { field: 'apiDomain', header: 'apiDomain' },
      { field: 'apiPath', header: 'apiPath' },
      {
        field: 'actions',
        header: 'action',
        type: 'actions',
        actions: [
          {
            label: 'edit',
            icon: 'pi pi-pencil',
            severity: 'info',
            onClick: (row) => this.goEdit(row.id)
          },
          {
            label: 'delete',
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
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {

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
        error: () => this.toastService.error(this.i18nService.t('uploadStorage.loadListError'))
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
      this.toastService.info(this.i18nService.t('uploadStorage.selectDeleteRecord'));
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
    this.toastService.info(this.i18nService.t('uploadStorage.exportDeveloping'));
  }

  onImport(file: File): void {
    this.toastService.info(this.i18nService.t('uploadStorage.importSelectedFile').replace('{{name}}', file.name));
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
          this.toastService.info(this.i18nService.t('uploadStorage.deleteSuccess'));
          if (this.selectedStorageId === id) {
            this.selectedStorageId = null;
          }
          this.loadPage();
        },
        error: () => this.toastService.error(this.i18nService.t('uploadStorage.deleteError'))
      });
  }
}
