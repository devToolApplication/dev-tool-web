import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { UploadStorageCreateDto, UploadStorageResponse, UploadStorageUpdateDto } from '../../../../../core/models/file-storage/upload-storage.model';
import { UploadStorageService } from '../../../../../core/services/file-service/upload-storage.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { toUniqueTextOptions } from '../../../../form-option-utils';
import { STORAGE_USER_SECRETS_OPTIONS_SOURCE } from '../../../../form-input-options-loaders';
import { UPLOAD_STORAGE_INITIAL_VALUE } from '../upload-storage.constants';

@Component({
  selector: 'app-upload-storage-form',
  standalone: false,
  templateUrl: './upload-storage-form.component.html',
  styleUrl: './upload-storage-form.component.css'
})
export class UploadStorageFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {}
  };

  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('uploadStorage.nameRequired')] },
      { type: 'select', name: 'storageType', label: 'storageType', width: '1/2', options: [{ label: 'pinata', value: 'PINATA' }] },
      {
        type: 'auto-complete',
        name: 'apiDomain',
        label: 'apiDomain',
        width: '1/2',
        optionsExpression: 'context.extra?.apiDomainOptions || []'
      },
      {
        type: 'auto-complete',
        name: 'apiPath',
        label: 'apiPath',
        width: '1/2',
        optionsExpression: 'context.extra?.apiPathOptions || []'
      },
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
        optionsSource: STORAGE_USER_SECRETS_OPTIONS_SOURCE,
        valuePlaceholder: 'metadataValue',
        tokenUrlPlaceholder: 'tokenUrl',
        clientIdPlaceholder: 'clientId',
        clientSecretPlaceholder: 'selectClientSecret',
        passwordPlaceholder: 'selectPasswordSecret'
      },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  readonly loading = signal(false);
  editId: string | null = null;
  formInitialValue: UploadStorageCreateDto = { ...UPLOAD_STORAGE_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly uploadStorageService: UploadStorageService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    this.loading.set(true);
    this.loadingService.track(this.uploadStorageService.getAll().pipe(catchError(() => of([] as UploadStorageResponse[])))).pipe(finalize(() => this.loading.set(false))).subscribe((storages) => {
      this.formContext.extra = {
        apiDomainOptions: toUniqueTextOptions(storages, (item) => item.apiDomain),
        apiPathOptions: toUniqueTextOptions(storages, (item) => item.apiPath)
      };
      this.bindRouteMode();
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
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

    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.success(this.editId ? this.i18nService.t('uploadStorage.updateSuccess') : this.i18nService.t('uploadStorage.createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate(['/admin/upload-storage/storage']);
      },
      error: () => this.toastService.error(this.i18nService.t('uploadStorage.saveError'))
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.loadingService.track(this.uploadStorageService.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
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
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
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
