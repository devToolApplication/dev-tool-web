import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { StrategyConfigDto, StrategyConfigResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { parseJson, stringifyJson } from '../../trade-bot-form-utils';
import { STRATEGY_FORM, TRADE_BOT_ROUTES } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-strategy-config-form',
  standalone: false,
  templateUrl: './strategy-config-form.component.html'
})
export class StrategyConfigFormComponent implements OnInit {
  readonly formConfig = STRATEGY_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.strategy.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'save', label: 'tradeBot.action.save', icon: 'pi pi-save', submitForm: true, type: 'submit' }
    ]
  };
  formInitialValue: Record<string, unknown> = this.toFormValue();
  private id: string | null = null;

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.load(this.id);
    }
  }

  submit(model: Record<string, unknown>): void {
    let payload: StrategyConfigDto;
    try {
      payload = this.toPayload(model);
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.submitting.set(true);
    this.loadingService
      .track(this.service.saveStrategyConfig(this.id, payload))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('saveSuccess'));
          void this.router.navigate([TRADE_BOT_ROUTES.strategies]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  private load(id: string): void {
    this.submitting.set(true);
    this.loadingService
      .track(this.service.getStrategyConfig(id))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => (this.formInitialValue = this.toFormValue(res)),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private toPayload(model: Record<string, unknown>): StrategyConfigDto {
    return {
      code: String(model['code'] ?? ''),
      type: 'ENTRY_TP_SL',
      strategyVersion: String(model['strategyVersion'] ?? 'LATEST'),
      entryRule: String(model['entryRule'] ?? ''),
      slRule: String(model['slRule'] ?? ''),
      tpRule: String(model['tpRule'] ?? ''),
      status: String(model['status'] ?? 'ACTIVE'),
      config: parseJson(model['configText'], {})
    };
  }

  private toFormValue(value?: StrategyConfigResponse): Record<string, unknown> {
    return {
      code: value?.code ?? '',
      type: value?.type ?? 'ENTRY_TP_SL',
      strategyVersion: value?.strategyVersion ?? 'LATEST',
      entryRule: value?.entryRule ?? '',
      slRule: value?.slRule ?? '',
      tpRule: value?.tpRule ?? '',
      status: value?.status ?? 'ACTIVE',
      configText: stringifyJson(value?.config, { side: 'BUY' })
    };
  }
}
