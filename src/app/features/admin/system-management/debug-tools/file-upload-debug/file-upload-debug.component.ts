import { Component, OnInit } from '@angular/core';
import { FileUploadHandlerEvent } from 'primeng/fileupload';
import { finalize } from 'rxjs';
import { UploadFileResponse } from '../../../../../core/models/file-storage/upload-file.model';
import { UploadStorageResponse } from '../../../../../core/models/file-storage/upload-storage.model';
import { UploadFileService } from '../../../../../core/services/file-service/upload-file.service';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';

@Component({
  selector: 'app-file-upload-debug',
  standalone: false,
  templateUrl: './file-upload-debug.component.html',
  styleUrl: './file-upload-debug.component.css'
})
export class FileUploadDebugComponent implements OnInit {
  storages: UploadStorageResponse[] = [];
  selectedStorageId: string | null = null;
  fileName = '';
  metadataJson = '{}';
  loadingStorages = false;
  uploading = false;
  uploadResult: UploadFileResponse | null = null;
  uploadError = '';

  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  get storageOptions(): Array<{ label: string; value: string }> {
    return this.storages.map((item) => ({
      label: `${item.name || item.id} (${item.storageType})`,
      value: item.id
    }));
  }

  ngOnInit(): void {
    this.loadStorages();
  }

  loadStorages(): void {
    this.loadingStorages = true;
    this.loadingService
      .track(this.uploadStorageService.getAll())
      .pipe(finalize(() => (this.loadingStorages = false)))
      .subscribe({
        next: (storages) => {
          this.storages = storages;
          const defaultStorage = storages.find((item) => item.defaultActive && item.status === 'ACTIVE');
          this.selectedStorageId = this.selectedStorageId || defaultStorage?.id || null;
        },
        error: () => this.toastService.error('systemManagement.fileUploadDebug.toast.loadStoragesFailed')
      });
  }

  onUpload(event: FileUploadHandlerEvent): void {
    const file = event.files?.[0];
    if (!file) {
      this.toastService.error('systemManagement.fileUploadDebug.toast.chooseFileRequired');
      return;
    }

    const metadata = this.parseMetadataJson();
    if (!metadata) {
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.uploadResult = null;
    this.loadingService
      .track(
        this.uploadFileService.upload(file, {
          storageId: this.selectedStorageId,
          storageType: this.selectedStorageId ? null : 'PINATA',
          fileName: this.fileName,
          metadata
        })
      )
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: (result) => {
          this.uploadResult = result;
          this.toastService.info('systemManagement.fileUploadDebug.toast.uploadSuccess');
        },
        error: (error) => {
          this.uploadError = error?.error?.errorMessage || error?.message || 'systemManagement.fileUploadDebug.toast.uploadFailed';
          this.toastService.error(this.uploadError);
        }
      });
  }

  openUploadedFile(): void {
    if (this.uploadResult?.fileUrl) {
      window.open(this.uploadResult.fileUrl, '_blank', 'noopener,noreferrer');
    }
  }

  private parseMetadataJson(): Record<string, string> | null {
    const raw = this.metadataJson.trim();
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        this.toastService.error('systemManagement.fileUploadDebug.toast.metadataObjectRequired');
        return null;
      }

      return Object.entries(parsed).reduce<Record<string, string>>((result, [key, value]) => {
        result[key] = value == null ? '' : String(value);
        return result;
      }, {});
    } catch {
      this.toastService.error('systemManagement.fileUploadDebug.toast.metadataInvalid');
      return null;
    }
  }
}
