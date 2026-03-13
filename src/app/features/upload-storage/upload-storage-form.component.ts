import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  UploadStorageCreateDto,
  UploadStorageResponse,
  UploadStorageStatus,
  UploadStorageType,
  UploadStorageUpdateDto
} from '../../core/models/upload-storage.model';
import { LoadingService } from '../../core/ui-services/loading.service';
import { ToastService } from '../../core/ui-services/toast.service';
import { UploadStorageService } from '../../core/services/upload-storage.service';
import { FormConfig, FormContext } from '../../shared/ui/form-input/models/form-config.model';

@Component({
  selector: 'app-upload-storage-form',
  standalone: false,
  templateUrl: './upload-storage-form.component.html',
  styleUrl: './upload-storage-form.component.css'
})
export class UploadStorageFormComponent implements OnInit {
  readonly formContext: FormContext = {
    user: null,
    mode: 'create'
  };

  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        width: '1/2',
        validation: [{ expression: '!!model.name?.trim()', message: 'Tên storage là bắt buộc' }]
      },
      {
        type: 'select',
        name: 'storageType',
        label: 'Storage Type',
        width: '1/2',
        options: [{ label: 'PINATA', value: 'PINATA' }]
      },
      { type: 'text', name: 'apiDomain', label: 'API Domain', width: '1/2' },
      { type: 'text', name: 'apiPath', label: 'API Path', width: '1/2' },
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        width: '1/2',
        options: [
          { label: 'ACTIVE', value: 'ACTIVE' },
          { label: 'INACTIVE', value: 'INACTIVE' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      {
        type: 'checkbox',
        name: 'defaultActive',
        label: 'Default Active',
        width: '1/2'
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        width: 'full'
      },
      {
        type: 'record',
        name: 'metadata',
        label: 'Metadata',
        keyLabel: 'Metadata Key',
        valueLabel: 'Metadata Value',
        addButtonLabel: 'Add metadata',
        width: 'full'
      }
    ]
  };

  loading = false;
  editId: string | null = null;
  formInitialValue = this.createInitialFormValue();
  readonly formVisible = signal(true);

  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.editId = id;
        this.formContext.mode = 'edit';
        this.loadDetail(id);
        return;
      }

      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialFormValue();
      this.rerenderForm();
    });
  }

  onSubmitForm(rawModel: Record<string, unknown>): void {
    const metadata = this.normalizeMetadata(rawModel['metadata']);

    const request$ = this.editId
      ? this.uploadStorageService.update(this.editId, this.buildUpdatePayload(rawModel, metadata))
      : this.uploadStorageService.create(this.buildCreatePayload(rawModel, metadata));

    this.loading = true;
    this.loadingService
      .track(request$)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.toastService.success(this.editId ? 'Cập nhật upload storage thành công' : 'Tạo upload storage thành công');
          void this.router.navigate(['/admin/upload-storage/storage']);
        },
        error: () => this.toastService.error('Lưu upload storage thất bại')
      });
  }

  backToView(): void {
    void this.router.navigate(['/admin/upload-storage/storage']);
  }

  private loadDetail(id: string): void {
    this.loading = true;
    this.loadingService
      .track(this.uploadStorageService.getById(id))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (detail: UploadStorageResponse) => {
          this.formInitialValue = {
            name: detail.name,
            description: detail.description ?? '',
            storageType: detail.storageType,
            status: detail.status,
            defaultActive: detail.defaultActive,
            apiDomain: detail.apiDomain ?? '',
            apiPath: detail.apiPath ?? '',
            metadata: detail.metadata ?? {}
          };
          this.rerenderForm();
        },
        error: () => {
          this.toastService.error('Không lấy được chi tiết upload storage');
          void this.router.navigate(['/admin/upload-storage/storage']);
        }
      });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    queueMicrotask(() => this.formVisible.set(true));
  }

  private buildCreatePayload(model: Record<string, unknown>, metadata: Record<string, string>): UploadStorageCreateDto {
    return {
      name: String(model['name'] ?? '').trim(),
      description: this.optionalText(model['description']),
      storageType: (model['storageType'] as UploadStorageType) ?? 'PINATA',
      defaultActive: Boolean(model['defaultActive']),
      status: (model['status'] as UploadStorageStatus) ?? 'ACTIVE',
      apiDomain: this.optionalText(model['apiDomain']),
      apiPath: this.optionalText(model['apiPath']),
      metadata
    };
  }

  private buildUpdatePayload(model: Record<string, unknown>, metadata: Record<string, string>): UploadStorageUpdateDto {
    return {
      name: String(model['name'] ?? '').trim(),
      description: this.optionalText(model['description']),
      defaultActive: Boolean(model['defaultActive']),
      status: (model['status'] as UploadStorageStatus) ?? 'ACTIVE',
      apiDomain: this.optionalText(model['apiDomain']),
      apiPath: this.optionalText(model['apiPath']),
      metadata
    };
  }

  private optionalText(value: unknown): string | undefined {
    const text = String(value ?? '').trim();
    return text ? text : undefined;
  }

  private normalizeMetadata(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.trim();
      if (!normalizedKey) continue;
      result[normalizedKey] = String(item ?? '');
    }

    return result;
  }

  private createInitialFormValue(): Record<string, unknown> {
    return {
      name: '',
      description: '',
      storageType: 'PINATA',
      defaultActive: true,
      status: 'ACTIVE',
      apiDomain: '',
      apiPath: '',
      metadata: {
        apiKey: ''
      }
    };
  }
}
