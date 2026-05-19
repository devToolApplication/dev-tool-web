import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { TradeBotConfigCreateDto, TradeBotConfigResponse, TradeBotConfigUpdateDto } from '../../../../../../core/models/trade-bot/config.model';
import { TradeBotConfigService } from '../../../../../../core/services/trade-bot-service/config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { toUniqueTextOptions } from '../../../../../form-option-utils';
import { TRADE_BOT_CONFIG_INITIAL_VALUE, TRADE_BOT_CONFIG_ROUTES } from '../trade-bot-config.constants';

@Component({
  selector: 'app-trade-bot-config-form',
  standalone: false,
  templateUrl: './trade-bot-config-form.component.html'
})
export class TradeBotConfigFormComponent implements OnInit {
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
      {
        type: 'auto-complete',
        name: 'key',
        label: 'key',
        width: '1/2',
        optionsExpression: 'context.extra?.keyOptions || []',
        validation: [Rules.required('systemManagement.validation.keyRequired')]
      },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'value', label: 'systemManagement.field.jsonValue', width: 'full', showZoomButton: true, contentType: 'json', jsonValidationMessage: 'systemManagement.validation.invalidJson', validation: [Rules.required('systemManagement.validation.valueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: TradeBotConfigCreateDto = { ...TRADE_BOT_CONFIG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: TradeBotConfigService,
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
    this.loadingService.track(this.service.getAll().pipe(catchError(() => of([] as TradeBotConfigResponse[])))).pipe(finalize(() => this.loading.set(false))).subscribe((configs) => {
      this.formContext.extra = {
        categoryOptions: toUniqueTextOptions(configs, (item) => item.category),
        keyOptions: toUniqueTextOptions(configs, (item) => item.key)
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

  onSubmitForm(model: TradeBotConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as TradeBotConfigUpdateDto) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([TRADE_BOT_CONFIG_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.tradeBotConfig.toast.saveError'))
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
      this.formInitialValue = { ...TRADE_BOT_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: TradeBotConfigResponse) => {
        this.formInitialValue = this.mapResponseToFormValue(detail);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.tradeBotConfig.toast.loadDetailError'));
        void this.router.navigate([TRADE_BOT_CONFIG_ROUTES.list]);
      }
    });
  }

  private mapResponseToFormValue(detail: TradeBotConfigResponse): TradeBotConfigCreateDto {
    return {
      category: detail.category,
      key: detail.key,
      status: detail.status,
      description: detail.description ?? '',
      value: typeof detail.value === 'string' ? detail.value : JSON.stringify(detail.value ?? {}, null, 2)
    };
  }
}
