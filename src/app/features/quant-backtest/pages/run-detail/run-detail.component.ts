import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { AppTabItem } from '@shared/ui/primitives/tabs/tabs.component';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import {
  ORDER_SIDE_I18N_MAP,
  ORDER_STATUS_I18N_MAP,
  SIGNAL_ACTION_I18N_MAP,
  TRADE_SIDE_I18N_MAP,
  buildOrdersTableConfig,
  buildSignalsTableConfig,
  buildTradesTableConfig,
} from '../../models/quant-backtest.config';
import type {
  QuantEquityPointDto,
  CursorPageResponseDto,
  QuantMetricsDto,
  QuantOrderDto,
  QuantSignalDto,
  QuantTradeDto,
} from '../../models/quant-backtest.dto';
import type { BacktestRunDetailModel } from '../../models/quant-backtest.model';
import { extractQuantBffError, mapRunDetailDtoToModel } from '../../services/quant-backtest.mapper';

type DetailTab = 'trades' | 'orders' | 'signals' | 'config';
type CursorTab = Exclude<DetailTab, 'config'>;

@Component({
  selector: 'app-run-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './run-detail.component.html',
  styleUrl: './run-detail.component.css',
})
export class RunDetailComponent implements OnInit {
  private readonly apiService = inject(QuantBacktestApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly runId = signal('');
  readonly loading = signal(false);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);
  readonly errorCorrelationId = signal<string | null>(null);
  readonly runDetail = signal<BacktestRunDetailModel | null>(null);
  readonly metrics = signal<QuantMetricsDto | null>(null);
  readonly metricsLoading = signal(false);
  readonly metricsError = signal<string | null>(null);
  readonly metricsErrorCode = signal<string | null>(null);
  readonly metricsCorrelationId = signal<string | null>(null);
  readonly activeTab = signal<DetailTab>('trades');

  readonly trades = signal<QuantTradeDto[]>([]);
  readonly tradesLoading = signal(false);
  readonly tradesError = signal<string | null>(null);
  readonly tradesErrorCode = signal<string | null>(null);
  readonly tradesCorrelationId = signal<string | null>(null);
  readonly tradesNextCursor = signal<string | null>(null);
  readonly tradesHasMore = signal(false);

  readonly orders = signal<QuantOrderDto[]>([]);
  readonly ordersLoading = signal(false);
  readonly ordersError = signal<string | null>(null);
  readonly ordersErrorCode = signal<string | null>(null);
  readonly ordersCorrelationId = signal<string | null>(null);
  readonly ordersNextCursor = signal<string | null>(null);
  readonly ordersHasMore = signal(false);

  readonly signals = signal<QuantSignalDto[]>([]);
  readonly signalsLoading = signal(false);
  readonly signalsError = signal<string | null>(null);
  readonly signalsErrorCode = signal<string | null>(null);
  readonly signalsCorrelationId = signal<string | null>(null);
  readonly signalsNextCursor = signal<string | null>(null);
  readonly signalsHasMore = signal(false);

  readonly equityPoints = signal<QuantEquityPointDto[]>([]);
  readonly equityLoading = signal(false);
  readonly equityError = signal<string | null>(null);
  readonly equityErrorCode = signal<string | null>(null);
  readonly equityCorrelationId = signal<string | null>(null);
  readonly equityNextCursor = signal<string | null>(null);
  readonly equityHasMore = signal(false);

  readonly tradesConfig = buildTradesTableConfig();
  readonly ordersConfig = buildOrdersTableConfig();
  readonly signalsConfig = buildSignalsTableConfig();

  readonly tabs: AppTabItem[] = [
    { label: 'quantBacktest.detail.tabs.trades', value: 'trades' },
    { label: 'quantBacktest.detail.tabs.orders', value: 'orders' },
    { label: 'quantBacktest.detail.tabs.signals', value: 'signals' },
    { label: 'quantBacktest.detail.tabs.config', value: 'config' },
  ];

  readonly pageActions: ActionToolbarAction[] = [
    {
      id: 'refresh',
      label: 'quantBacktest.detail.action.refresh',
      icon: 'pi pi-refresh',
      variant: 'secondary',
    },
    {
      id: 'back',
      label: 'quantBacktest.detail.action.back',
      icon: 'pi pi-arrow-left',
      variant: 'ghost',
    },
  ];

  readonly breadcrumb = computed(() => [
    { label: 'quantBacktest.breadcrumb.root' },
    { label: 'quantBacktest.breadcrumb.runs', routerLink: '/quant-backtest/runs' },
    {
      label: this.runDetail()?.name ?? this.runId() ?? 'quantBacktest.breadcrumb.detail',
    },
  ]);

  readonly isJobRunning = computed(() => {
    const status = this.runDetail()?.jobStatus;
    return status === 'RUNNING' || status === 'PENDING';
  });

  readonly isJobFailed = computed(() => {
    const status = this.runDetail()?.jobStatus;
    return status === 'FAILED' || status === 'TIMEOUT';
  });

  readonly isQuantUnavailable = computed(() => {
    const detail = this.runDetail();
    return (
      detail?.jobStatus === 'SUCCESS' &&
      (!detail.quantOutcome || detail.quantOutcome === 'UNAVAILABLE')
    );
  });

  getTradeSideI18nKey(side: string): string {
    return (
      TRADE_SIDE_I18N_MAP[side] ??
      (side ? `quantBacktest.side.${side}` : 'quantBacktest.common.notAvailable')
    );
  }

  getOrderSideI18nKey(side: string): string {
    return (
      ORDER_SIDE_I18N_MAP[side] ??
      (side ? `quantBacktest.side.${side}` : 'quantBacktest.common.notAvailable')
    );
  }

  getOrderStatusI18nKey(status: string): string {
    return (
      ORDER_STATUS_I18N_MAP[status] ??
      (status ? `quantBacktest.orderStatus.${status}` : 'quantBacktest.common.notAvailable')
    );
  }

  getOrderStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'FILLED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'CANCELED':
      case 'CANCELLED':
        return 'muted';
      case 'SUBMITTED':
        return 'info';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  }

  getSignalActionI18nKey(action: string): string {
    return (
      SIGNAL_ACTION_I18N_MAP[action] ??
      (action ? `quantBacktest.signalAction.${action}` : 'quantBacktest.common.notAvailable')
    );
  }

  getSignalActionVariant(action: string): BadgeVariant {
    switch (action) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'danger';
      case 'CLOSE':
        return 'warning';
      case 'HOLD':
        return 'info';
      default:
        return 'default';
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('runId') ?? '';
    this.runId.set(id);
    if (id) {
      this.loadRunDetail(id);
    }
  }

  // ponytail: inline feedback combines code and correlation in message string; upgrade to dedicated correlation badge when shared error-state supports correlation slot.
  formatErrorMessage(
    message: string | null,
    code: string | null,
    correlationId?: string | null,
  ): string {
    if (!message && !code) {
      return '';
    }
    const prefix = code ? `[${code}] ` : '';
    const body = message ?? '';
    const suffix = correlationId ? ` (Correlation: ${correlationId})` : '';
    return `${prefix}${body}${suffix}`.trim();
  }

  loadRunDetail(id: string, isRefresh = false): void {
    if (isRefresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    this.errorCode.set(null);
    this.errorCorrelationId.set(null);

    this.apiService.getRunDetail(id).subscribe({
      next: (dto) => {
        this.runDetail.set(mapRunDetailDtoToModel(dto));
        this.loading.set(false);
        this.refreshing.set(false);
        this.loadMetrics(id);
        this.loadEquityData(id);
        this.loadActiveTabData(id, this.activeTab());
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.error.set(parsed.message);
        this.errorCode.set(parsed.code);
        this.errorCorrelationId.set(parsed.correlationId ?? null);
        this.loading.set(false);
        this.refreshing.set(false);
        this.toast.error('quantBacktest.error.loadDetail', parsed.message);
      },
    });
  }

  loadMetrics(id: string): void {
    this.metricsLoading.set(true);
    this.metricsError.set(null);
    this.metricsErrorCode.set(null);
    this.metricsCorrelationId.set(null);
    this.apiService.getMetrics(id).subscribe({
      next: (response) => {
        this.metrics.set(response.metrics);
        this.metricsLoading.set(false);
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.metricsError.set(parsed.message);
        this.metricsErrorCode.set(parsed.code);
        this.metricsCorrelationId.set(parsed.correlationId ?? null);
        this.metricsLoading.set(false);
      },
    });
  }

  loadEquityData(id: string, cursor?: string | null, append = false): void {
    this.equityLoading.set(true);
    this.equityError.set(null);
    this.equityErrorCode.set(null);
    this.equityCorrelationId.set(null);
    this.apiService.getEquity(id, cursor).subscribe({
      next: (response) => {
        this.equityPoints.update((items) =>
          append ? [...items, ...response.data] : response.data,
        );
        this.equityNextCursor.set(response.metadata.nextCursor);
        this.equityHasMore.set(response.metadata.hasMore);
        this.equityLoading.set(false);
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.equityError.set(parsed.message);
        this.equityErrorCode.set(parsed.code);
        this.equityCorrelationId.set(parsed.correlationId ?? null);
        this.equityLoading.set(false);
      },
    });
  }

  loadMoreEquity(): void {
    const id = this.runId();
    const cursor = this.equityNextCursor();
    if (id && cursor && this.equityHasMore() && !this.equityLoading()) {
      this.loadEquityData(id, cursor, true);
    }
  }

  loadActiveTabData(id: string, tab: string, cursor?: string | null, append = false): void {
    if (tab === 'trades') {
      this.loadCursorTab('trades', () => this.apiService.getTrades(id, cursor), append);
    } else if (tab === 'orders') {
      this.loadCursorTab('orders', () => this.apiService.getOrders(id, cursor), append);
    } else if (tab === 'signals') {
      this.loadCursorTab('signals', () => this.apiService.getSignals(id, cursor), append);
    }
  }

  loadMoreTrades(): void {
    this.loadMoreCursorTab('trades', this.tradesNextCursor(), this.tradesHasMore());
  }

  loadMoreOrders(): void {
    this.loadMoreCursorTab('orders', this.ordersNextCursor(), this.ordersHasMore());
  }

  loadMoreSignals(): void {
    this.loadMoreCursorTab('signals', this.signalsNextCursor(), this.signalsHasMore());
  }

  retryTrades(): void {
    this.retryCursorTab('trades', this.trades().length, this.tradesNextCursor());
  }

  retryOrders(): void {
    this.retryCursorTab('orders', this.orders().length, this.ordersNextCursor());
  }

  retrySignals(): void {
    this.retryCursorTab('signals', this.signals().length, this.signalsNextCursor());
  }

  retryEquity(): void {
    const cursor = this.equityNextCursor();
    const append = this.equityPoints().length > 0 && cursor !== null;
    this.loadEquityData(this.runId(), append ? cursor : undefined, append);
  }

  onTabChange(tabValue: string): void {
    const tab = tabValue as DetailTab;
    this.activeTab.set(tab);
    if (this.runId() && tab !== 'config') {
      this.loadActiveTabData(this.runId(), tab);
    }
  }

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'refresh' && this.runId()) {
      this.loadRunDetail(this.runId(), true);
    } else if (action.id === 'back') {
      void this.router.navigate(['/quant-backtest/runs']);
    }
  }

  private loadMoreCursorTab(tab: CursorTab, cursor: string | null, hasMore: boolean): void {
    if (this.runId() && cursor && hasMore && !this.isTabLoading(tab)) {
      this.loadActiveTabData(this.runId(), tab, cursor, true);
    }
  }

  private retryCursorTab(tab: CursorTab, itemCount: number, cursor: string | null): void {
    const append = itemCount > 0 && cursor !== null;
    this.loadActiveTabData(this.runId(), tab, append ? cursor : undefined, append);
  }

  private loadCursorTab<T extends QuantTradeDto | QuantOrderDto | QuantSignalDto>(
    tab: CursorTab,
    request: () => Observable<CursorPageResponseDto<T>>,
    append: boolean,
  ): void {
    this.setTabLoading(tab, true);
    this.setTabError(tab, null, null, null);
    request().subscribe({
      next: (response) => {
        this.setTabItems(
          tab,
          response.data as QuantTradeDto[] | QuantOrderDto[] | QuantSignalDto[],
          append,
        );
        this.setTabCursor(tab, response.metadata.nextCursor, response.metadata.hasMore);
        this.setTabLoading(tab, false);
      },
      error: (error: unknown) => {
        const parsed = extractQuantBffError(error);
        this.setTabError(tab, parsed.message, parsed.code, parsed.correlationId ?? null);
        this.setTabLoading(tab, false);
      },
    });
  }

  private setTabItems(
    tab: CursorTab,
    items: QuantTradeDto[] | QuantOrderDto[] | QuantSignalDto[],
    append: boolean,
  ): void {
    if (tab === 'trades') {
      this.trades.update((current) =>
        append ? [...current, ...(items as QuantTradeDto[])] : (items as QuantTradeDto[]),
      );
    } else if (tab === 'orders') {
      this.orders.update((current) =>
        append ? [...current, ...(items as QuantOrderDto[])] : (items as QuantOrderDto[]),
      );
    } else {
      this.signals.update((current) =>
        append ? [...current, ...(items as QuantSignalDto[])] : (items as QuantSignalDto[]),
      );
    }
  }

  private setTabCursor(tab: CursorTab, nextCursor: string | null, hasMore: boolean): void {
    if (tab === 'trades') {
      this.tradesNextCursor.set(nextCursor);
      this.tradesHasMore.set(hasMore);
    } else if (tab === 'orders') {
      this.ordersNextCursor.set(nextCursor);
      this.ordersHasMore.set(hasMore);
    } else {
      this.signalsNextCursor.set(nextCursor);
      this.signalsHasMore.set(hasMore);
    }
  }

  private setTabLoading(tab: CursorTab, loading: boolean): void {
    if (tab === 'trades') {
      this.tradesLoading.set(loading);
    } else if (tab === 'orders') {
      this.ordersLoading.set(loading);
    } else {
      this.signalsLoading.set(loading);
    }
  }

  private isTabLoading(tab: CursorTab): boolean {
    return tab === 'trades'
      ? this.tradesLoading()
      : tab === 'orders'
        ? this.ordersLoading()
        : this.signalsLoading();
  }

  private setTabError(
    tab: CursorTab,
    message: string | null,
    code: string | null,
    correlationId: string | null = null,
  ): void {
    if (tab === 'trades') {
      this.tradesError.set(message);
      this.tradesErrorCode.set(code);
      this.tradesCorrelationId.set(correlationId);
    } else if (tab === 'orders') {
      this.ordersError.set(message);
      this.ordersErrorCode.set(code);
      this.ordersCorrelationId.set(correlationId);
    } else {
      this.signalsError.set(message);
      this.signalsErrorCode.set(code);
      this.signalsCorrelationId.set(correlationId);
    }
  }
}
