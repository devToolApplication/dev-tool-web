import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { StorageSecretCreateDto, StorageSecretResponse, StorageSecretUpdateDto } from '../../../../../../core/models/file-storage/storage-secret.model';
import { StorageSecretService } from '../../../../../../core/services/file-service/storage-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { toUniqueTextOptions } from '../../../../../form-option-utils';
import { STORAGE_SECRET_INITIAL_VALUE, STORAGE_SECRET_ROUTES } from '../storage-secret.constants';

@Component({
  selector: 'app-storage-secret-form',
  standalone: false,
  templateUrl: './storage-secret-form.component.html'
})
export class StorageSecretFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'auto-complete',
        name: 'category',
        label: 'category',
        width: '1/2',
        optionsExpression: 'context.extra?.categoryOptions || []',
        validation: [Rules.required('systemManagement.validation.categoryRequired')]
      },
      { type: 'text', name: 'name', label: 'name', width: '1/2', validation: [Rules.required('systemManagement.validation.nameRequired')] },
      { type: 'text', name: 'code', label: 'code', width: '1/2', validation: [Rules.required('systemManagement.validation.codeRequired')] },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'secretValue', label: 'systemManagement.field.secretValue', width: 'full', showZoomButton: true, validation: [Rules.required('systemManagement.validation.secretValueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: StorageSecretCreateDto = { ...STORAGE_SECRET_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: StorageSecretService,
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
    this.loadingService.track(this.service.getAll().pipe(catchError(() => of([] as StorageSecretResponse[])))).pipe(finalize(() => this.loading.set(false))).subscribe((secrets) => {
      this.formContext.extra = {
        categoryOptions: toUniqueTextOptions(secrets, (item) => item.category)
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

  onSubmitForm(model: StorageSecretCreateDto): void {
    const request$ = this.editId
      ? this.service.update(this.editId, model as StorageSecretUpdateDto)
      : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([STORAGE_SECRET_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.storageSecret.toast.saveError'))
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...STORAGE_SECRET_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: StorageSecretResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.storageSecret.toast.loadDetailError'));
        void this.router.navigate([STORAGE_SECRET_ROUTES.list]);
      }
    });
  }
}
