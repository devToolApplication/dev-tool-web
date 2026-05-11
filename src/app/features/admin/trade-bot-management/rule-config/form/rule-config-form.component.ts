import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RuleConfigDto, RuleConfigResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { parseJson, stringifyJson } from '../../trade-bot-form-utils';
import { RULE_FORM, TRADE_BOT_ROUTES } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-rule-config-form',
  standalone: false,
  templateUrl: './rule-config-form.component.html'
})
export class RuleConfigFormComponent implements OnInit {
  readonly formConfig = RULE_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.rule.formTitle',
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
    let payload: RuleConfigDto;
    try {
      payload = this.toPayload(model);
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.submitting.set(true);
    this.loadingService
      .track(this.service.saveRuleConfig(this.id, payload))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('saveSuccess'));
          void this.router.navigate([TRADE_BOT_ROUTES.rules]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  private load(id: string): void {
    this.submitting.set(true);
    this.loadingService
      .track(this.service.getRuleConfig(id))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => (this.formInitialValue = this.toFormValue(res)),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private toPayload(model: Record<string, unknown>): RuleConfigDto {
    return {
      code: String(model['code'] ?? ''),
      executor: String(model['executor'] ?? ''),
      executorVersion: String(model['executorVersion'] ?? 'LATEST'),
      status: String(model['status'] ?? 'ACTIVE'),
      indicators: parseJson(model['indicatorsText'], []),
      config: parseJson(model['configText'], {}),
      childRules: parseJson(model['childRulesText'], []),
      overlay: parseJson(model['overlayText'], {})
    };
  }

  private toFormValue(value?: RuleConfigResponse): Record<string, unknown> {
    return {
      code: value?.code ?? '',
      executor: value?.executor ?? '',
      executorVersion: value?.executorVersion ?? 'LATEST',
      status: value?.status ?? 'ACTIVE',
      indicatorsText: stringifyJson(value?.indicators, []),
      configText: stringifyJson(value?.config, {}),
      childRulesText: stringifyJson(value?.childRules, []),
      overlayText: stringifyJson(value?.overlay, {})
    };
  }
}
