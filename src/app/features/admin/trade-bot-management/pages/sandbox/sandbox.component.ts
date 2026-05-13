import { Component, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  EvaluateBarRequest,
  EvaluateBarResponse,
  FastBacktestRequest,
  FastBacktestResponse
} from '../../../../../core/models/trade-bot/trading-system.model';
import { SandboxService } from '../../../../../core/services/trade-bot-service/sandbox.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { EVALUATE_BAR_FORM, SANDBOX_FORM } from '../../trade-bot-runtime.constants';
import { parseJson } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-sandbox',
  standalone: false,
  templateUrl: './sandbox.component.html'
})
export class SandboxComponent {
  readonly sandboxForm = SANDBOX_FORM;
  readonly evaluateBarForm = EVALUATE_BAR_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly loading = signal(false);
  readonly evaluateLoading = signal(false);
  readonly fastBacktest = signal<FastBacktestResponse | null>(null);
  readonly evaluateBar = signal<EvaluateBarResponse | null>(null);

  readonly sandboxInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    startIndex: null,
    endIndex: null,
    warmupBars: 0,
    initialCapital: 10000,
    riskPerTradePct: 1,
    feeRate: 0,
    slippageRate: 0,
    paramsText: '{}'
  };

  readonly evaluateInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    index: 0,
    paramsText: '{}'
  };

  constructor(
    private readonly service: SandboxService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  runFastBacktest(model: Record<string, unknown>): void {
    let payload: FastBacktestRequest;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        source: optionalText(model['source']),
        marketType: optionalText(model['marketType']),
        feedCode: optionalText(model['feedCode']),
        fromTime: String(model['fromTime'] ?? ''),
        toTime: String(model['toTime'] ?? ''),
        startIndex: numberOrUndefined(model['startIndex']),
        endIndex: numberOrUndefined(model['endIndex']),
        warmupBars: numberOrUndefined(model['warmupBars']),
        initialCapital: numberOrUndefined(model['initialCapital']),
        riskPerTradePct: numberOrUndefined(model['riskPerTradePct']),
        feeRate: numberOrUndefined(model['feeRate']),
        slippageRate: numberOrUndefined(model['slippageRate']),
        params: parseJson(model['paramsText'], {})
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }

    this.loading.set(true);
    this.loadingService
      .track(this.service.runFastBacktest(payload))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.fastBacktest.set(response),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.sandboxFailed'))
      });
  }

  evaluate(model: Record<string, unknown>): void {
    let payload: EvaluateBarRequest;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        source: optionalText(model['source']),
        marketType: optionalText(model['marketType']),
        feedCode: optionalText(model['feedCode']),
        fromTime: String(model['fromTime'] ?? ''),
        toTime: String(model['toTime'] ?? ''),
        index: Number(model['index'] ?? 0),
        params: parseJson(model['paramsText'], {})
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }

    this.evaluateLoading.set(true);
    this.loadingService
      .track(this.service.evaluateBar(payload))
      .pipe(finalize(() => this.evaluateLoading.set(false)))
      .subscribe({
        next: (response) => this.evaluateBar.set(response),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'))
      });
  }

  fastBacktestJson(): string {
    return JSON.stringify(this.fastBacktest(), null, 2);
  }

  evaluateBarJson(): string {
    return JSON.stringify(this.evaluateBar(), null, 2);
  }
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
