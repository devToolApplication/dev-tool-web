import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { SyncConfigResponse } from '../../../../../../core/models/trade-bot/sync-config.model';
import { TradeBotCandleResponse } from '../../../../../../core/models/trade-bot/chart-query.model';
import { ChartQueryService } from '../../../../../../core/services/trade-bot-service/chart-query.service';
import { SyncConfigService } from '../../../../../../core/services/trade-bot-service/sync-config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { TRADE_BOT_ROUTES } from '../../../trade-bot.constants';

@Component({
  selector: 'app-trade-bot-chart-view',
  standalone: false,
  templateUrl: './trade-bot-chart-view.component.html',
  styleUrl: './trade-bot-chart-view.component.css'
})
export class TradeBotChartViewComponent implements OnInit, OnDestroy {
  chartResponse: TradeBotCandleResponse | null = null;

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

  get intervalOptions(): Array<{ label: string; value: string }> {
    return (this.syncConfig?.intervals ?? []).map((interval) => ({ label: interval, value: interval }));
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
            if ((response.candlestickData ?? []).length === 0) {
              return;
            }

            this.chartResponse = response;
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
          if ((response.candlestickData ?? []).length === 0) {
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

          this.chartResponse = response;
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
}
