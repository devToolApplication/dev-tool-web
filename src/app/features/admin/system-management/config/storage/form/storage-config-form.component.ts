import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { StorageConfigCreateDto, StorageConfigResponse, StorageConfigUpdateDto } from '../../../../../../core/models/file-storage/storage-config.model';
import { StorageConfigService } from '../../../../../../core/services/file-service/storage-config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { STORAGE_CONFIG_INITIAL_VALUE, STORAGE_CONFIG_ROUTES } from '../storage-config.constants';

@Component({
  selector: 'app-storage-config-form',
  standalone: false,
  templateUrl: './storage-config-form.component.html'
})
export class StorageConfigFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'category', label: 'category', width: '1/2', validation: [Rules.required('systemManagement.validation.categoryRequired')] },
      { type: 'text', name: 'key', label: 'key', width: '1/2', validation: [Rules.required('systemManagement.validation.keyRequired')] },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'value', label: 'systemManagement.field.jsonValue', width: 'full', validation: [Rules.required('systemManagement.validation.valueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: StorageConfigCreateDto = { ...STORAGE_CONFIG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: StorageConfigService,
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

  onSubmitForm(model: StorageConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as StorageConfigUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([STORAGE_CONFIG_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.storageConfig.toast.saveError'))
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...STORAGE_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: StorageConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.storageConfig.toast.loadDetailError'));
        void this.router.navigate([STORAGE_CONFIG_ROUTES.list]);
      }
    });
  }
}
