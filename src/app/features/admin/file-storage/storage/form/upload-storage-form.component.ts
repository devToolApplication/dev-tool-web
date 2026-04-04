import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UploadStorageCreateDto, UploadStorageResponse, UploadStorageUpdateDto } from '../../../../../core/models/file-storage/upload-storage.model';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { UPLOAD_STORAGE_INITIAL_VALUE, UPLOAD_STORAGE_METADATA_TYPE_OPTIONS } from '../upload-storage.constants';

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
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('uploadStorage.nameRequired')] },
      { type: 'select', name: 'storageType', label: 'storageType', width: '1/2', options: [{ label: 'pinata', value: 'PINATA' }] },
      { type: 'text', name: 'apiDomain', label: 'apiDomain', width: '1/2' },
      { type: 'text', name: 'apiPath', label: 'apiPath', width: '1/2' },
      {
        type: 'select',
        name: 'status',
        label: 'status',
        width: '1/2',
        options: [
          { label: 'active', value: 'ACTIVE' },
          { label: 'inactive', value: 'INACTIVE' },
          { label: 'DELETE', value: 'DELETE' }
        ]
      },
      { type: 'checkbox', name: 'defaultActive', label: 'defaultActive', width: '1/2' },
      {
        type: 'secret-metadata',
        name: 'metadata',
        label: 'secretMetadata',
        width: 'full',
        service: 'file-mcrs'
      },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  loading = false;
  editId: string | null = null;
  formInitialValue: UploadStorageCreateDto = { ...UPLOAD_STORAGE_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  onSubmitForm(model: UploadStorageCreateDto): void {
    const request$ = this.editId
      ? this.uploadStorageService.update(this.editId, model as UploadStorageUpdateDto)
      : this.uploadStorageService.create(model);

    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.editId ? this.i18nService.t('uploadStorage.updateSuccess') : this.i18nService.t('uploadStorage.createSuccess'));
        void this.router.navigate(['/admin/upload-storage/storage']);
      },
      error: () => this.toastService.error(this.i18nService.t('uploadStorage.saveError'))
    });
  }

  private loadDetail(id: string): void {
    this.loading = true;
    this.loadingService.track(this.uploadStorageService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: UploadStorageResponse) => {
        this.formInitialValue = {
          name: detail.name,
          description: detail.description ?? '',
          storageType: detail.storageType,
          status: detail.status,
          defaultActive: detail.defaultActive,
          apiDomain: detail.apiDomain ?? '',
          apiPath: detail.apiPath ?? '',
          metadata: detail.metadata ?? []
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('uploadStorage.detailError'));
        void this.router.navigate(['/admin/upload-storage/storage']);
      }
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private applyRouteMode(id: string | null): void {
    if (id) {
      this.editId = id;
      this.formContext.mode = 'edit';
      this.loadDetail(id);
      return;
    }

    this.editId = null;
    this.formContext.mode = 'create';
    this.formInitialValue = { ...UPLOAD_STORAGE_INITIAL_VALUE };
    this.rerenderForm();
  }
}
