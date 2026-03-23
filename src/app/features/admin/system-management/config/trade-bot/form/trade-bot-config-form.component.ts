import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { TradeBotConfigCreateDto, TradeBotConfigResponse, TradeBotConfigUpdateDto } from '../../../../../../core/models/trade-bot/config.model';
import { TradeBotConfigService } from '../../../../../../core/services/trade-bot-service/config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { TRADE_BOT_CONFIG_INITIAL_VALUE, TRADE_BOT_CONFIG_ROUTES } from '../trade-bot-config.constants';

@Component({
  selector: 'app-trade-bot-config-form',
  standalone: false,
  templateUrl: './trade-bot-config-form.component.html'
})
export class TradeBotConfigFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'category', label: 'Category', width: '1/2', validation: [Rules.required('Category is required')] },
      { type: 'text', name: 'key', label: 'Key', width: '1/2', validation: [Rules.required('Key is required')] },
      { type: 'select', name: 'status', label: 'Status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'value', label: 'JSON Value', width: 'full', validation: [Rules.required('Value is required')] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: TradeBotConfigCreateDto = { ...TRADE_BOT_CONFIG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: TradeBotConfigService,
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

  onSubmitForm(model: TradeBotConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as TradeBotConfigUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([TRADE_BOT_CONFIG_ROUTES.list]);
      },
      error: () => this.toastService.error('Save trade bot config failed')
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
      this.formInitialValue = { ...TRADE_BOT_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: TradeBotConfigResponse) => {
        this.formInitialValue = this.mapResponseToFormValue(detail);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load trade bot config detail failed');
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
