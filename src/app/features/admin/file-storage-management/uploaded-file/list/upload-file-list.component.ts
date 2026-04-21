import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { UploadFileResponse } from '../../../../../core/models/file-storage/upload-file.model';
import { UploadStorageResponse } from '../../../../../core/models/file-storage/upload-storage.model';
import { UploadFileService } from '../../../../../core/services/file-service/upload-file.service';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-upload-file-list',
  standalone: false,
  templateUrl: './upload-file-list.component.html',
  styleUrl: './upload-file-list.component.css'
})
export class UploadFileListComponent extends BasePagedList<UploadFileResponse> implements OnInit {
  tableConfig: TableConfig = {
    title: 'Uploaded Files',
    minWidth: '112rem',
    filters: [
      { field: 'fileName', label: 'File name', placeholder: 'Search file name' },
      { field: 'storageId', label: 'Storage', type: 'select', options: [] },
      { field: 'mimeType', label: 'MIME type', placeholder: 'image/png' }
    ],
    filterOptions: {
      primaryField: 'fileName'
    },
    toolbar: {
      export: {
        visible: true,
        label: 'Refresh',
        icon: 'pi pi-refresh',
        severity: 'secondary'
      }
    },
    columns: [
      { field: 'fileName', header: 'File name', sortable: true, width: '20rem', frozen: true, alignFrozen: 'left' },
      { field: 'mimeType', header: 'MIME type', width: '12rem' },
      { field: 'storageId', header: 'Storage ID', width: '18rem' },
      { field: 'fileUrl', header: 'URL', width: '28rem' },
      { field: 'createdAt', header: 'Created At', type: 'date', format: 'dd/MM/yyyy HH:mm', width: '12rem' },
      { field: 'updatedAt', header: 'Updated At', type: 'date', format: 'dd/MM/yyyy HH:mm', width: '12rem' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '16rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          {
            label: 'Open',
            icon: 'pi pi-external-link',
            severity: 'info',
            disabled: (row) => !row.fileUrl,
            onClick: (row) => this.openFile(row)
          },
          {
            label: 'delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            disabled: () => this.loading,
            onClick: (row) => this.deleteFile(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50]
  };

  loading = false;
  tableLoading = false;
  storages: UploadStorageResponse[] = [];

  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    super(route, router, 10);
  }

  ngOnInit(): void {
    this.loadStorages();
    this.loadPage();
  }

  onExport(): void {
    this.loadPage();
  }

  protected loadPage(): void {
    this.tableLoading = true;
    this.loadingService
      .track(this.uploadFileService.getPage(this.page, this.pageSize, ['createdAt,desc'], this.filters as Record<string, string | number | boolean>))
      .pipe(finalize(() => (this.tableLoading = false)))
      .subscribe({
        next: (res: BasePageResponse<UploadFileResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error('Load uploaded files failed')
      });
  }

  private loadStorages(): void {
    this.loadingService.track(this.uploadStorageService.getAll()).subscribe({
      next: (storages) => {
        this.storages = storages;
        const options = storages.map((item) => ({
          label: item.name || item.id,
          value: item.id
        }));

        this.tableConfig = {
          ...this.tableConfig,
          filters: (this.tableConfig.filters ?? []).map((item) =>
            item.field === 'storageId' ? { ...item, options } : item
          )
        };
      },
      error: () => this.toastService.error('Load upload storages failed')
    });
  }

  private openFile(row: UploadFileResponse): void {
    if (!row.fileUrl) {
      return;
    }

    window.open(row.fileUrl, '_blank', 'noopener,noreferrer');
  }

  private deleteFile(id: string): void {
    this.loading = true;
    this.loadingService
      .track(this.uploadFileService.delete(id))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.info('Uploaded file deleted');
          this.loadPage();
        },
        error: () => this.toastService.error('Delete uploaded file failed')
      });
  }
}
