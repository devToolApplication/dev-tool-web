import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { TradeBotConfigResponse } from '../../../../../core/models/trade-bot/config.model';
import { SyncConfigCreateDto, SyncConfigResponse, SyncConfigUpdateDto } from '../../../../../core/models/trade-bot/sync-config.model';
import { TradeBotConfigService } from '../../../../../core/services/trade-bot-service/config.service';
import { SyncConfigService } from '../../../../../core/services/trade-bot-service/sync-config.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { TRADE_BOT_DATA_RESOURCE_OPTIONS, TRADE_BOT_INITIAL_VALUE, TRADE_BOT_ROUTES, TRADE_BOT_SYMBOL_OPTIONS } from '../../trade-bot.constants';

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-sync-config-form',
  standalone: false,
  templateUrl: './sync-config-form.component.html'
})
export class SyncConfigFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { intervalOptions: [] } };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'select', name: 'dataResource', label: 'tradeBot.dataResource', width: '1/2', options: [...TRADE_BOT_DATA_RESOURCE_OPTIONS], validation: [Rules.required('tradeBot.dataResourceRequired')] },
      { type: 'select', name: 'symbol', label: 'tradeBot.symbol', width: '1/2', options: [...TRADE_BOT_SYMBOL_OPTIONS], validation: [Rules.required('tradeBot.symbolRequired')] },
      { type: 'select-multi', name: 'intervals', label: 'tradeBot.intervals', width: 'full', optionsExpression: 'context.extra?.intervalOptions || []', validation: [Rules.requiredArray('tradeBot.intervalsRequired')] },
      { type: 'select', name: 'status', label: 'tradeBot.status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS], validation: [Rules.required('tradeBot.statusRequired')] }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: SyncConfigCreateDto = { ...TRADE_BOT_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: SyncConfigService,
    private readonly tradeBotConfigService: TradeBotConfigService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadIntervalOptions();
  }

  onSubmitForm(model: SyncConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as SyncConfigUpdateDto) : this.service.create(model);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.i18nService.t(this.editId ? 'tradeBot.updateSyncConfigSuccess' : 'tradeBot.createSyncConfigSuccess'));
        void this.router.navigate([TRADE_BOT_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('tradeBot.saveSyncConfigError'))
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private loadIntervalOptions(): void {
    this.loading = true;
    this.loadingService
      .track(this.tradeBotConfigService.getAll({ category: 'SYNC_CONFIG', key: 'INTEVALS' }))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (configs: TradeBotConfigResponse[]) => {
          const intervalOptions = this.parseIntervalOptions(configs[0]?.value);
          this.formContext.extra = { ...(this.formContext.extra ?? {}), intervalOptions };
          this.bindRouteMode();
        },
        error: () => {
          this.formContext.extra = { ...(this.formContext.extra ?? {}), intervalOptions: [] };
          this.toastService.error(this.i18nService.t('tradeBot.loadIntervalConfigError'));
          this.bindRouteMode();
        }
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

  private parseIntervalOptions(rawValue: unknown): SelectOption[] {
    if (!Array.isArray(rawValue)) {
      return [];
    }

    return rawValue
      .map((item) => ({
        label: String((item as Record<string, unknown>)['label'] ?? '').trim(),
        value: String((item as Record<string, unknown>)['value'] ?? '').trim()
      }))
      .filter((item) => item.label !== '' && item.value !== '');
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...TRADE_BOT_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: SyncConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('tradeBot.loadSyncConfigDetailError'));
        void this.router.navigate([TRADE_BOT_ROUTES.list]);
      }
    });
  }
}
