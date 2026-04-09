import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { StrategyCreateDto, StrategyResponse, StrategyUpdateDto } from '../../../../../core/models/trade-bot/reference-data.model';
import { StrategyConfigService } from '../../../../../core/services/trade-bot-service/strategy-config.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { STRATEGY_CONFIG_INITIAL_VALUE, STRATEGY_CONFIG_ROUTES } from '../strategy-config.constants';

@Component({
  selector: 'app-strategy-config-form',
  standalone: false,
  templateUrl: './strategy-config-form.component.html'
})
export class StrategyConfigFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'serviceName', label: 'tradeBot.strategy.field.strategyCode', width: '1/2', validation: [Rules.required('tradeBot.strategyConfig.validation.serviceNameRequired')] },
      { type: 'text', name: 'name', label: 'tradeBot.strategy.field.strategyName', width: '1/2', validation: [Rules.required('tradeBot.strategyConfig.validation.strategyNameRequired')] },
      { type: 'text', name: 'version', label: 'tradeBot.strategy.field.version', width: '1/2' },
      { type: 'select', name: 'status', label: 'tradeBot.strategy.field.status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS], validation: [Rules.required('tradeBot.strategyConfig.validation.statusRequired')] },
      { type: 'textarea', name: 'description', label: 'tradeBot.strategy.field.description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  readonly formVisible = signal(true);
  formInitialValue: StrategyCreateDto = { ...STRATEGY_CONFIG_INITIAL_VALUE };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: StrategyConfigService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.bindRouteMode();
  }

  onSubmitForm(model: StrategyCreateDto): void {
    const payload: StrategyCreateDto = {
      serviceName: model.serviceName.trim(),
      name: model.name.trim(),
      description: model.description?.trim() || undefined,
      version: model.version?.trim() || undefined,
      status: model.status
    };
    const request$ = this.editId ? this.service.update(this.editId, payload as StrategyUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.i18nService.t(this.editId ? 'tradeBot.strategyConfig.toast.updateSuccess' : 'tradeBot.strategyConfig.toast.createSuccess'));
        void this.router.navigate([STRATEGY_CONFIG_ROUTES.list]);
      },
      error: (error) => this.toastService.error(error?.error?.errorMessage ?? this.i18nService.t('tradeBot.strategyConfig.toast.saveError'))
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...STRATEGY_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: StrategyResponse) => {
        this.formInitialValue = {
          serviceName: detail.serviceName ?? '',
          name: detail.name ?? '',
          description: detail.description ?? '',
          version: detail.version ?? '',
          status: detail.status
        };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('tradeBot.strategyConfig.toast.loadDetailError'));
        void this.router.navigate([STRATEGY_CONFIG_ROUTES.list]);
      }
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }
}
