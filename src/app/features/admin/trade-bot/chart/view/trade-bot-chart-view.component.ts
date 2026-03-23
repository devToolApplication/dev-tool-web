import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { SyncConfigResponse } from '../../../../../core/models/trade-bot/sync-config.model';
import { TradeBotCandleResponse } from '../../../../../core/models/trade-bot/chart-query.model';
import { ChartQueryService } from '../../../../../core/services/trade-bot-service/chart-query.service';
import { SyncConfigService } from '../../../../../core/services/trade-bot-service/sync-config.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CandleChartConfig, CandleChartPayload } from '../../../../../shared/component/candle-chart/candle-chart';
import { TRADE_BOT_ROUTES } from '../../trade-bot.constants';

@Component({
  selector: 'app-trade-bot-chart-view',
  standalone: false,
  templateUrl: './trade-bot-chart-view.component.html',
  styleUrl: './trade-bot-chart-view.component.css'
})
export class TradeBotChartViewComponent implements OnInit, OnDestroy {
  readonly chartConfig: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true
  };

  chartPayload: CandleChartPayload = {
    candles: [],
    lines: [],
    boxAreas: [],
    points: []
  };

  syncConfig: SyncConfigResponse | null = null;
  selectedInterval = '';
  dateRange: Date[] = [];
  loading = false;

  private liveSubscription?: Subscription;
  private snapshotSubscription?: Subscription;
  private syncConfigId: string | null = null;
  private initializeTimeoutId: number | null = null;
  private liveTopicKey: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly syncConfigService: SyncConfigService,
    private readonly chartQueryService: ChartQueryService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.syncConfigId = params.get('id');
      if (!this.syncConfigId) {
        void this.router.navigate([TRADE_BOT_ROUTES.list]);
        return;
      }

      window.setTimeout(() => {
        if (this.syncConfigId) {
          this.loadSyncConfig(this.syncConfigId);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.liveSubscription?.unsubscribe();
    this.snapshotSubscription?.unsubscribe();
    if (this.initializeTimeoutId !== null) {
      window.clearTimeout(this.initializeTimeoutId);
    }
  }

  onLoadChart(): void {
    this.loadChartData();
  }

  onBack(): void {
    void this.router.navigate([TRADE_BOT_ROUTES.list]);
  }

  private loadSyncConfig(id: string): void {
    this.loading = true;
    this.loadingService.track(this.syncConfigService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (config) => {
        const selectedInterval = config.intervals[0] ?? '';
        const startDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const endDate = new Date();

        if (this.initializeTimeoutId !== null) {
          window.clearTimeout(this.initializeTimeoutId);
        }

        this.initializeTimeoutId = window.setTimeout(() => {
          this.selectedInterval = selectedInterval;
          this.dateRange = [startDate, endDate];
          this.syncConfig = config;
          this.initializeTimeoutId = null;
          this.loadChartData();
        });
      },
      error: () => {
        this.toastService.error(this.i18nService.t('tradeBot.loadSyncConfigDetailError'));
        void this.router.navigate([TRADE_BOT_ROUTES.list]);
      }
    });
  }

  private loadChartData(): void {
    const [startDate, endDate] = this.dateRange;
    if (!this.syncConfig || !this.selectedInterval || !startDate || !endDate) {
      return;
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime) || startTime >= endTime) {
      this.toastService.error(this.i18nService.t('tradeBot.invalidTimeRange'));
      return;
    }

    this.refreshChartSnapshot(startTime, endTime, true, true);
  }

  private bindLiveData(): void {
    if (!this.syncConfig || !this.selectedInterval || !this.syncConfigId) {
      return;
    }

    const nextTopicKey = `${this.syncConfig.dataResource}:${this.syncConfig.symbol}:${this.selectedInterval}`;
    if (this.liveTopicKey === nextTopicKey && this.liveSubscription) {
      return;
    }

    this.liveSubscription?.unsubscribe();
    this.liveTopicKey = nextTopicKey;

    this.liveSubscription = this.chartQueryService
      .createLiveCandleStream(this.syncConfig.dataResource, this.syncConfig.symbol, this.selectedInterval)
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            const nextPayload = this.mapChartPayload(response);
            if (nextPayload.candles.length === 0) {
              return;
            }

            this.chartPayload = nextPayload;
          });
        },
        error: () => this.ngZone.run(() => this.toastService.error(this.i18nService.t('tradeBot.websocketDisconnected')))
      });
  }

  private refreshChartSnapshot(startTime: number, endTime: number, showLoading: boolean, rebindLiveData: boolean): void {
    if (!this.syncConfig) {
      return;
    }

    this.snapshotSubscription?.unsubscribe();
    if (showLoading) {
      this.loading = true;
    }

    this.snapshotSubscription = this.loadingService
      .track(this.chartQueryService.getCandle(this.syncConfig.symbol, this.selectedInterval, startTime, endTime))
      .pipe(finalize(() => {
        if (showLoading) {
          this.loading = false;
        }
      }))
      .subscribe({
        next: (response) => {
          const nextPayload = this.mapChartPayload(response);
          if (nextPayload.candles.length === 0) {
            console.warn('[TradeBotChartView] ignore empty snapshot payload', {
              dataResource: this.syncConfig?.dataResource,
              symbol: this.syncConfig?.symbol,
              interval: this.selectedInterval,
              startTime,
              endTime,
            });
            if (showLoading) {
              this.toastService.error(this.i18nService.t('tradeBot.noChartData'));
            }
            return;
          }

          this.chartPayload = nextPayload;
          if (rebindLiveData) {
            this.bindLiveData();
          }
        },
        error: () => {
          if (showLoading) {
            this.toastService.error(this.i18nService.t('tradeBot.loadChartDataError'));
          }
        }
      });
  }

  private mapChartPayload(response: TradeBotCandleResponse): CandleChartPayload {
    const candles = (response.candlestickData ?? [])
      .slice()
      .sort((left, right) => left.utcTimeStamp - right.utcTimeStamp)
      .map((item) => ({
        time: this.formatChartTime(item.utcTimeStamp),
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
        volume: item.volume
      }));

    return {
      candles,
      lines: (response.lineData ?? [])
        .filter((item) => item.from && item.to)
        .map((item) => ({
        name: item.name ?? 'Line',
        color: item.color ?? '#0ea5e9',
        start: item.from!.value,
        end: item.to!.value,
        startTime: this.formatChartTime(item.from!.time),
        endTime: this.formatChartTime(item.to!.time)
      })),
      boxAreas: (response.areaData ?? [])
        .filter((item) => item.from != null && item.to != null && item.maxPrice != null && item.minPrice != null)
        .map((item) => ({
          name: item.name ?? 'Zone',
          color: item.color ?? 'rgba(59, 130, 246, 0.18)',
          startTime: this.formatChartTime(item.from!),
          endTime: this.formatChartTime(item.to!),
          high: item.maxPrice!,
          low: item.minPrice!
        })),
      points: (response.pointData ?? []).map((item) => ({
        name: item.name ?? 'Point',
        color: item.color ?? '#f59e0b',
        startTime: this.formatChartTime(item.time),
        price: item.value
      }))
    };
  }
  private formatChartTime(value: number): string {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
  }
}
