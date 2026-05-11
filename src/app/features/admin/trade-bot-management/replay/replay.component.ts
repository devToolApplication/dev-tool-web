import { Component, computed, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import { ReplayInitDto, ReplayInitResponse } from '../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import {
  CandleChartBarChangedEvent,
  CandleChartConfig,
  CandleChartEvaluationResult,
  ChartCandle,
  ChartIndicator,
  EvaluationConfig,
  ReplayConfig
} from '../../../../shared/component/candle-chart/candle-chart';
import { CandleChartOverlayMapper } from '../../../../shared/component/candle-chart/candle-chart-overlay.mapper';
import { FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';
import { EVALUATE_FORM, REPLAY_INIT_FORM } from '../trade-bot-runtime.constants';
import { parseJson } from '../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-replay',
  standalone: false,
  templateUrl: './replay.component.html'
})
export class ReplayComponent {
  readonly replayForm = REPLAY_INIT_FORM;
  readonly evaluateForm = EVALUATE_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly loading = signal(false);
  readonly replay = signal<ReplayInitResponse | null>(null);
  readonly evaluation = signal<Record<string, unknown> | null>(null);
  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.replay()?.symbol,
    interval: this.replay()?.timeframe,
    height: 460,
    showOverlayLabels: true,
    showReplayControls: true,
    showToolbar: true,
    showDebugPanel: true,
    evaluateOnBarChange: true
  }));
  readonly chartCandles = computed<ChartCandle[]>(() =>
    (this.replay()?.candles ?? []).map((candle, index) => ({
      index,
      time: candle.openTime,
      openTime: candle.openTime,
      closeTime: candle.closeTime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume ?? 0),
      closed: candle.closed
    }))
  );
  readonly chartIndicators = computed<ChartIndicator[]>(() => {
    const overlays = this.replay()?.overlay?.overlays ?? {};
    return this.overlayMapper.indicatorsFromOverlayRecord(overlays, this.chartCandles());
  });
  readonly replayConfig: ReplayConfig = {
    initialIndex: 0,
    speedMs: 650,
    autoPlay: false,
    loop: false
  };
  readonly replayInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    fromTime: '',
    toTime: '',
    overlayCodesText: '[]'
  };
  readonly evaluateInitialValue = { runId: '', index: 0 };
  readonly evaluateModel = signal<Record<string, unknown>>(this.evaluateInitialValue);
  readonly chartEvaluationConfig = computed<EvaluationConfig>(() => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    return {
      enabled: runId.length > 0,
      runId,
      includeStrategy: true,
      includeTrace: false
    };
  });
  readonly evaluateCurrentBar = (event: CandleChartBarChangedEvent): Observable<CandleChartEvaluationResult | null> | null => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    if (!runId) {
      return null;
    }
    return this.service.evaluateStrategy(runId, event.index).pipe(map((response) => response as CandleChartEvaluationResult));
  };
  readonly candleTableConfig: TableConfig = {
    title: 'tradeBot.replay.candles',
    columns: [
      { field: 'openTime', header: 'tradeBot.field.openTime', type: 'date', minWidth: '13rem' },
      { field: 'open', header: 'tradeBot.field.open', type: 'number' },
      { field: 'high', header: 'tradeBot.field.high', type: 'number' },
      { field: 'low', header: 'tradeBot.field.low', type: 'number' },
      { field: 'close', header: 'tradeBot.field.close', type: 'number' }
    ],
    pagination: true,
    rows: 25,
    minWidth: '68rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly overlayMapper: CandleChartOverlayMapper,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  initReplay(model: Record<string, unknown>): void {
    let payload: ReplayInitDto;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        fromTime: String(model['fromTime'] ?? ''),
        toTime: String(model['toTime'] ?? ''),
        overlayCodes: parseJson(model['overlayCodesText'], [])
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.loading.set(true);
    this.loadingService
      .track(this.service.initReplay(payload))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.replay.set(response),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  evaluateTrace(model: Record<string, unknown>): void {
    this.evaluate(model, true);
  }

  evaluateStrategy(model: Record<string, unknown>): void {
    this.evaluate(model, false);
  }

  onChartStrategySignal(signal: Record<string, unknown>): void {
    this.evaluation.set(signal);
  }

  onChartRuleEvaluated(trace: Record<string, unknown>): void {
    this.evaluation.set(trace);
  }

  onChartError(): void {
    this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'));
  }

  replayJson(): string {
    return JSON.stringify(this.replay()?.overlay?.overlays ?? {}, null, 2);
  }

  evaluationJson(): string {
    return JSON.stringify(this.evaluation() ?? {}, null, 2);
  }

  private evaluate(model: Record<string, unknown>, trace: boolean): void {
    const runId = String(model['runId'] ?? '');
    const index = Number(model['index'] ?? 0);
    this.loading.set(true);
    const request = trace ? this.service.evaluateTrace(runId, index) : this.service.evaluateStrategy(runId, index);
    this.loadingService
      .track(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.evaluation.set(response),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'))
      });
  }
}
