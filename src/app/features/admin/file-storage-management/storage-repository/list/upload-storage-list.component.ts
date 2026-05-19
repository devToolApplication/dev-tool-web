import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadStorageResponse } from '../../../../../core/models/file-storage/upload-storage.model';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-upload-storage-list',
  standalone: false,
  templateUrl: './upload-storage-list.component.html',
  styleUrl: './upload-storage-list.component.css'
})
export class UploadStorageListComponent extends BasePagedList<UploadStorageResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'uploadStorage.viewTitle',
    stateKey: 'file-storage.upload-storages',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'uploadStorage.loadListError',
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
      },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    columns: [
      { field: 'id', header: 'id', type: 'copyable', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      { field: 'storageType', header: 'storageType' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        badgeMap: { ACTIVE: 'success', INACTIVE: 'muted', DELETE: 'danger' }
      },
      { field: 'defaultActive', header: 'default', type: 'boolean' },
      { field: 'apiDomain', header: 'apiDomain', type: 'copyable' },
      { field: 'apiPath', header: 'apiPath', type: 'copyable' },
      {
        field: 'actions',
        header: 'action',
        type: 'actions',
        minWidth: '12rem',
        frozen: true,
        alignFrozen: 'right',
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
            variant: 'danger',
            confirm: { message: 'shared.confirm.dangerAction', variant: 'danger' },
            onClick: (row) => this.removeById(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50]
  };

  selectedStorageId: string | null = null;

  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly i18nService: I18nService
  ) {
    super(route, router, 10, ['name,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  protected loadPage(): void {
    this.runPageRequest(
      this.loadingService.track(
        this.uploadStorageService.getPage(
          this.page,
          this.pageSize,
          this.sorts,
          this.filters as Record<string, string | number | boolean>
        )
      ),
      {
        errorMessage: 'uploadStorage.loadListError',
        onSuccess: () => {
          if (this.selectedStorageId && !this.rows.some((row) => row.id === this.selectedStorageId)) {
            this.selectedStorageId = null;
          }
        },
        onError: () => this.toastService.error(this.i18nService.t('uploadStorage.loadListError'))
      }
    );
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
    this.loadingService
      .track(this.uploadStorageService.delete(id))
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
