import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  signal,
  ViewChild,
} from '@angular/core';
import { from, isObservable, of, Subscription } from 'rxjs';

import { CandleChartEngineService, type CandleChartEngineRenderInput } from './candle-chart-engine.service';
import { CandleChartLegacyAdapter } from './candle-chart-legacy-adapter.service';
import type {
  CandleChartBarChangedEvent,
  CandleChartConfig,
  CandleChartErrorEvent,
  CandleChartEvaluateHandler,
  CandleChartEvaluationResult,
  CandleChartMode,
  CandleChartPayload,
  CandleChartRange,
  CandleChartRangeBoundaryEvent,
  CandleChartReplayStatusEvent,
  CandleChartRuleEvaluation,
  CandleChartStatus,
  CandleChartStrategySignal,
  ChartCandle,
  ChartIndicator,
  ChartOverlay,
  EvaluationConfig,
  RealtimeConfig,
  RenderedBoxArea,
  RenderedLineLabel,
  ReplayConfig,
  ResolvedCandleChartConfig,
} from './candle-chart.models';
import { CandleChartOverlayMapper } from './candle-chart-overlay.mapper';
import { CandleChartRealtimeService } from './candle-chart-realtime.service';
import { CandleChartReplayService, type CandleChartReplayStep } from './candle-chart-replay.service';
import { CandleChartStoreService } from './candle-chart-store.service';
import { CandleChartTimeUtil } from './candle-chart-time.util';

export * from './candle-chart.models';

@Component({
  selector: 'app-candle-chart',
  standalone: false,
  templateUrl: './candle-chart.html',
  styleUrl: './candle-chart.css',
  providers: [
    CandleChartEngineService,
    CandleChartLegacyAdapter,
    CandleChartRealtimeService,
    CandleChartReplayService,
    CandleChartStoreService,
    CandleChartTimeUtil,
  ],
})
export class CandleChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartRef', { static: true })
  chartRef!: ElementRef<HTMLDivElement>;

  @Input() config: CandleChartConfig = {};
  @Input() data: CandleChartPayload = this.emptyPayload();
  @Input() mode: CandleChartMode | null = null;
  @Input() symbol?: string;
  @Input() timeframe?: string;
  @Input() candles: ChartCandle[] | null = null;
  @Input() indicators: ChartIndicator[] | null = null;
  @Input() overlays: ChartOverlay[] | null = null;
  @Input() replayConfig: ReplayConfig | null = null;
  @Input() realtimeConfig: RealtimeConfig | null = null;
  @Input() evaluationConfig: EvaluationConfig | null = null;
  @Input() evaluateHandler: CandleChartEvaluateHandler | null = null;

  @Output() readonly barChanged = new EventEmitter<CandleChartBarChangedEvent>();
  @Output() readonly candleSelected = new EventEmitter<ChartCandle>();
  @Output() readonly ruleEvaluated = new EventEmitter<CandleChartRuleEvaluation | Record<string, unknown>>();
  @Output() readonly strategySignal = new EventEmitter<CandleChartStrategySignal | Record<string, unknown>>();
  @Output() readonly replayStatusChanged = new EventEmitter<CandleChartReplayStatusEvent>();
  @Output() readonly error = new EventEmitter<CandleChartErrorEvent>();
  @Output() readonly rangeBoundaryReached = new EventEmitter<CandleChartRangeBoundaryEvent>();

  latestCandle: ChartCandle | null = null;
  renderedBoxAreas: RenderedBoxArea[] = [];
  renderedLineLabels: RenderedLineLabel[] = [];
  readonly selectedRange = signal<CandleChartRange>('ALL');
  readonly fullscreen = signal(false);
  readonly overlayFilters = signal<Record<string, boolean>>({
    entries: true,
    exits: true,
    stopLoss: true,
    takeProfit: true,
    indicators: true,
    failedEntries: true,
  });
  readonly previewClockLabel = signal(this.buildClockLabel());
  readonly latestEvaluation = signal<Record<string, unknown> | null>(null);
  readonly rangeOptions: Array<{ label: string; value: CandleChartRange }> = [
    { label: '1D', value: '1D' },
    { label: '5D', value: '5D' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: 'YTD', value: 'YTD' },
    { label: '1Y', value: '1Y' },
    { label: '5Y', value: '5Y' },
    { label: 'All', value: 'ALL' },
  ];
  readonly replaySpeedOptions = [
    { label: '0.25x', value: 1600 },
    { label: '0.5x', value: 1000 },
    { label: '1x', value: 650 },
    { label: '2x', value: 300 },
    { label: '4x', value: 120 },
  ];
  readonly overlayToggleOptions = [
    { key: 'entries', label: 'tradeBot.chart.overlay.entries' },
    { key: 'exits', label: 'tradeBot.chart.overlay.exits' },
    { key: 'stopLoss', label: 'tradeBot.chart.overlay.stopLoss' },
    { key: 'takeProfit', label: 'tradeBot.chart.overlay.takeProfit' },
    { key: 'indicators', label: 'tradeBot.chart.overlay.indicators' },
    { key: 'failedEntries', label: 'tradeBot.chart.overlay.failedEntries' },
  ];

  private initialized = false;
  private destroyed = false;
  private themeObserver: MutationObserver | null = null;
  private clockIntervalId: number | null = null;
  private evaluationSubscription: Subscription | null = null;
  private lastRenderInput: CandleChartEngineRenderInput | null = null;
  private evaluationOverlays: ChartOverlay[] = [];
  private realtimeOverlayBuffer: ChartOverlay[] = [];
  private forceSetDataOnNextRender = false;
  private forceFitContentOnNextRender = true;
  private lastRangeBoundaryKey = '';
  private readonly lastRangeBoundaryEmitAt: Record<CandleChartRangeBoundaryEvent['direction'], number> = {
    PAST: 0,
    FUTURE: 0,
  };

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly engine: CandleChartEngineService,
    private readonly legacyAdapter: CandleChartLegacyAdapter,
    private readonly ngZone: NgZone,
    private readonly overlayMapper: CandleChartOverlayMapper,
    readonly store: CandleChartStoreService,
    private readonly realtimeService: CandleChartRealtimeService,
    private readonly replayService: CandleChartReplayService,
  ) {}

  get chartHeight(): number {
    if (this.fullscreen()) {
      return Math.max(360, window.innerHeight - 128);
    }
    return this.resolvedConfig().height;
  }

  get showHeader(): boolean {
    return this.resolvedConfig().showHeader;
  }

  get showToolbar(): boolean {
    return this.resolvedConfig().showToolbar;
  }

  get showPreviewBar(): boolean {
    return this.resolvedConfig().showPreviewBar;
  }

  get showReplayControls(): boolean {
    return this.store.mode() === 'REPLAY' && this.resolvedConfig().showReplayControls;
  }

  get showDebugPanel(): boolean {
    return this.resolvedConfig().showDebugPanel;
  }

  get chartTitle(): string {
    const config = this.resolvedConfig();
    return [this.symbol ?? config.symbol, this.timeframe ?? config.timeframe ?? config.interval, config.exchange]
      .filter(Boolean)
      .join(' - ');
  }

  get showStateOverlay(): boolean {
    const config = this.resolvedConfig();
    return config.loading === true || !!config.errorMessage || this.totalCandles === 0;
  }

  get stateOverlaySeverity(): 'loading' | 'error' | 'empty' {
    const config = this.resolvedConfig();
    if (config.loading) {
      return 'loading';
    }
    if (config.errorMessage) {
      return 'error';
    }
    return 'empty';
  }

  get stateOverlayMessage(): string {
    const config = this.resolvedConfig();
    if (config.loading) {
      return 'tradeBot.chart.state.loading';
    }
    if (config.errorMessage) {
      return config.errorMessage;
    }
    return 'tradeBot.chart.state.empty';
  }

  get currentIndex(): number {
    return this.store.currentIndex();
  }

  get totalCandles(): number {
    return this.store.candles().length;
  }

  get isPlaying(): boolean {
    return this.store.status() === 'PLAYING';
  }

  get latestChange(): number {
    return this.latestCandle ? this.latestCandle.close - this.latestCandle.open : 0;
  }

  get latestChangePercent(): number {
    if (!this.latestCandle || this.latestCandle.open === 0) {
      return 0;
    }
    return (this.latestChange / this.latestCandle.open) * 100;
  }

  get latestTone(): 'up' | 'down' | 'flat' {
    if (this.latestChange > 0) {
      return 'up';
    }
    if (this.latestChange < 0) {
      return 'down';
    }
    return 'flat';
  }

  ngAfterViewInit(): void {
    void this.initializeChart();
    this.refreshPreviewClock();
    this.clockIntervalId = window.setInterval(() => this.refreshPreviewClock(), 1000);
    this.ngZone.runOutsideAngular(() => window.addEventListener('resize', this.onResize));
    this.observeThemeChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) {
      return;
    }

    const resetIndex = Boolean(changes['candles'] || changes['data'] || changes['replayConfig']);
    this.syncInputsAndRender(resetIndex);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    window.removeEventListener('resize', this.onResize);
    if (this.clockIntervalId != null) {
      window.clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }
    this.themeObserver?.disconnect();
    this.evaluationSubscription?.unsubscribe();
    this.replayService.pause();
    this.realtimeService.disconnect();
    this.engine.destroy();
  }

  formatPrice(value: number | undefined): string {
    return Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }

  formatVolume(value: number | undefined): string {
    const numericValue = Number(value ?? 0);
    if (Math.abs(numericValue) >= 1_000_000_000) {
      return `${(numericValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(numericValue) >= 1_000_000) {
      return `${(numericValue / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(numericValue) >= 1_000) {
      return `${(numericValue / 1_000).toFixed(2)}K`;
    }
    return numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  applyRange(range: CandleChartRange): void {
    this.selectedRange.set(range);
    this.forceFitContentOnNextRender = true;
    this.renderStore();
  }

  fitContent(): void {
    this.applyRange('ALL');
  }

  toggleFullscreen(): void {
    this.fullscreen.update((value) => !value);
    window.setTimeout(() => this.onResize());
  }

  exportChartImage(): void {
    const canvas = this.chartRef.nativeElement.querySelector('canvas');
    if (!canvas) {
      return;
    }
    const link = document.createElement('a');
    link.download = `${this.chartTitle || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  toggleOverlayFilter(key: string): void {
    this.overlayFilters.update((filters) => ({ ...filters, [key]: !filters[key] }));
    this.store.overlays.set(this.resolveAllOverlays());
    this.renderStore();
  }

  overlayFilterEnabled(key: string): boolean {
    return this.overlayFilters()[key] !== false;
  }

  overlayToggleButtonClass(key: string): string {
    return [
      'candle-chart-toggle-button',
      this.overlayFilterEnabled(key) ? 'candle-chart-toggle-button--active' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  rangeButtonClass(range: CandleChartRange): string {
    return ['candle-chart-range-button', this.selectedRange() === range ? 'candle-chart-range-button--active' : '']
      .filter(Boolean)
      .join(' ');
  }

  legendItems(): Array<{ label: string; value: number; color: string }> {
    const overlays = this.store.overlays();
    return [
      { label: 'tradeBot.chart.overlay.indicators', value: this.store.indicators().length, color: 'var(--app-finance-chart-crosshair)' },
      { label: 'tradeBot.chart.overlay.entries', value: overlays.filter((overlay) => this.overlayMatches(overlay, ['ENTRY', 'BUY', 'LONG'])).length, color: 'var(--app-chart-candle-up)' },
      { label: 'tradeBot.chart.overlay.exits', value: overlays.filter((overlay) => this.overlayMatches(overlay, ['EXIT', 'SELL', 'CLOSE'])).length, color: 'var(--app-chart-candle-down)' },
      { label: 'tradeBot.chart.overlay.stopLoss', value: overlays.filter((overlay) => this.overlayMatches(overlay, ['SL', 'STOP'])).length, color: 'var(--app-chart-candle-down)' },
      { label: 'tradeBot.chart.overlay.takeProfit', value: overlays.filter((overlay) => this.overlayMatches(overlay, ['TP', 'TAKE'])).length, color: 'var(--app-chart-candle-up)' },
    ].filter((item) => item.value > 0);
  }

  playReplay(): void {
    if (this.store.mode() !== 'REPLAY') {
      return;
    }
    this.replayService.play(this.currentIndex, this.totalCandles, this.currentReplayConfig(), (step) =>
      this.applyReplayStep(step),
    );
  }

  pauseReplay(): void {
    this.replayService.pause();
    this.store.setStatus(this.totalCandles ? 'PAUSED' : 'IDLE');
    this.emitReplayStatus();
  }

  replayFirst(): void {
    this.replayService.pause();
    this.applyReplayStep(this.replayService.first(this.totalCandles), true);
  }

  replayPrevious(): void {
    this.replayService.pause();
    this.applyReplayStep(this.replayService.previous(this.currentIndex, this.totalCandles), true);
  }

  replayNext(): void {
    this.replayService.pause();
    this.applyReplayStep(this.replayService.next(this.currentIndex, this.totalCandles, this.currentReplayConfig()), true);
  }

  replayLast(): void {
    this.replayService.pause();
    this.applyReplayStep(this.replayService.last(this.totalCandles), true);
  }

  seekReplay(value: string | number | null | undefined): void {
    this.replayService.pause();
    this.applyReplayStep(this.replayService.seek(Number(value), this.totalCandles), true);
  }

  changeReplaySpeed(value: string | number | boolean | null | undefined): void {
    const speedMs = Number(value);
    this.store.speedMs.set(Number.isNaN(speedMs) ? 650 : speedMs);
    if (this.isPlaying) {
      this.playReplay();
    }
    this.emitReplayStatus();
  }

  private async initializeChart(): Promise<void> {
    this.syncInputState(true);
    const input = this.createRenderInput();
    this.lastRenderInput = input;
    await this.ngZone.runOutsideAngular(() =>
      this.engine.initialize(
        this.chartRef.nativeElement,
        input,
        (state) => this.applyRenderState(state.latestCandle, state.renderedBoxAreas, state.renderedLineLabels),
        (candle) => this.selectCandle(candle),
        (range, candleCount) => this.handleVisibleRangeChange(range, candleCount),
      ),
    );
    if (this.destroyed) {
      return;
    }
    this.initialized = true;
    this.connectRealtimeIfNeeded();
    if (this.store.mode() === 'REPLAY' && this.currentReplayConfig().autoPlay) {
      this.playReplay();
    }
  }

  private syncInputsAndRender(resetIndex: boolean): void {
    this.syncInputState(resetIndex);
    this.forceSetDataOnNextRender = resetIndex;
    this.connectRealtimeIfNeeded();
    this.renderStore();
    if (resetIndex && this.store.mode() === 'REPLAY' && this.currentReplayConfig().autoPlay) {
      this.playReplay();
    }
  }

  private syncInputState(resetIndex: boolean): void {
    const mode = this.resolveMode();
    const candles = this.resolveInputCandles();
    const indicators = this.resolveInputIndicators();
    const overlays = this.resolveAllOverlays();
    this.store.configure(mode, candles, indicators, overlays, this.currentReplayConfig(), resetIndex);
  }

  private renderStore(): void {
    if (!this.initialized && !this.lastRenderInput) {
      return;
    }
    const input = this.createRenderInput();
    this.lastRenderInput = input;
    this.ngZone.runOutsideAngular(() => this.engine.render(input));
    this.forceSetDataOnNextRender = false;
    this.forceFitContentOnNextRender = false;
  }

  private createRenderInput(): CandleChartEngineRenderInput {
    const mode = this.store.mode();
    const currentIndex = this.store.currentIndex();
    const visibleCandles = this.store.visibleCandles();
    return {
      candles: visibleCandles,
      indicators: this.store.indicators(),
      overlays: this.filterOverlaysForVisibleIndex(this.store.overlays(), mode, currentIndex),
      config: this.resolvedConfig(),
      selectedRange: this.selectedRange(),
      forceSetData: this.forceSetDataOnNextRender,
      fitContent: !this.resolvedConfig().preserveViewportOnDataUpdate || this.forceFitContentOnNextRender,
    };
  }

  private applyReplayStep(step: CandleChartReplayStep, fromUserAction = false): void {
    const candle = this.store.setCurrentIndex(step.index);
    this.store.setStatus(step.status);
    this.renderStore();
    this.emitReplayStatus();
    if (candle && (fromUserAction || step.status === 'PLAYING' || step.status === 'ENDED')) {
      this.emitBarChanged(candle);
    }
  }

  private emitReplayStatus(): void {
    this.replayStatusChanged.emit({
      index: this.currentIndex,
      status: this.store.status(),
      speedMs: this.store.speedMs(),
    });
  }

  private emitBarChanged(candle: ChartCandle): void {
    const event: CandleChartBarChangedEvent = {
      index: this.currentIndex,
      candle,
      mode: this.store.mode(),
      status: this.store.status(),
    };
    this.barChanged.emit(event);
    this.evaluateCurrentBar(event);
  }

  private evaluateCurrentBar(event: CandleChartBarChangedEvent): void {
    const config = this.evaluationConfig;
    const shouldEvaluate = config?.enabled === true || this.resolvedConfig().evaluateOnBarChange;
    if (!shouldEvaluate || !this.evaluateHandler) {
      return;
    }
    if (this.resolvedConfig().evaluateOnClosedCandleOnly && event.candle.closed === false) {
      return;
    }

    this.evaluationSubscription?.unsubscribe();
    try {
      const result = this.evaluateHandler(event);
      const result$ = isObservable(result)
        ? result
        : result instanceof Promise
          ? from(result)
          : of(result);
      this.evaluationSubscription = result$.subscribe({
        next: (value) => this.applyEvaluationResult(value, event),
        error: (detail) => this.emitError('Chart evaluation failed', detail),
      });
    } catch (detail) {
      this.emitError('Chart evaluation failed', detail);
    }
  }

  private applyEvaluationResult(
    result: CandleChartEvaluationResult | null | undefined,
    event: CandleChartBarChangedEvent,
  ): void {
    if (!result) {
      return;
    }
    this.latestEvaluation.set(result as Record<string, unknown>);
    const trace = this.overlayMapper.resolveRuleTrace(result as Record<string, unknown>);
    if (trace) {
      this.ruleEvaluated.emit(trace);
    }
    const strategy = this.overlayMapper.resolveStrategySignal(result as Record<string, unknown>);
    if (strategy) {
      this.strategySignal.emit(strategy);
    }
    this.evaluationOverlays = this.overlayMapper.overlaysFromEvaluation(result, event);
    this.store.overlays.set(this.resolveAllOverlays());
    this.renderStore();
    this.changeDetectorRef.markForCheck();
  }

  private connectRealtimeIfNeeded(): void {
    if (this.store.mode() !== 'REALTIME') {
      this.realtimeService.disconnect();
      return;
    }

    this.realtimeService.connect(this.realtimeConfig, {
      candle: (candle) => {
        this.ngZone.run(() => {
          const index = this.store.appendRealtimeCandle(candle);
          const currentCandle = this.store.candles()[index];
          this.store.setStatus('READY');
          this.renderStore();
          if (currentCandle) {
            this.emitBarChanged(currentCandle);
          }
        });
      },
      overlay: (overlays) => {
        this.ngZone.run(() => {
          this.realtimeOverlayBuffer = overlays;
          this.store.overlays.set(this.resolveAllOverlays());
          this.renderStore();
        });
      },
      reset: (candles, overlays) => {
        this.ngZone.run(() => {
          this.realtimeOverlayBuffer = overlays;
          this.store.replaceRealtimeState(candles, this.resolveAllOverlays());
          this.renderStore();
        });
      },
      error: (event) => this.ngZone.run(() => this.emitError(event.message, event.detail)),
      status: (status) => this.ngZone.run(() => this.store.setStatus(status)),
    });
  }

  private selectCandle(candle: ChartCandle): void {
    this.ngZone.run(() => {
      this.store.setSelectedCandle(candle);
      this.candleSelected.emit(candle);
      this.changeDetectorRef.markForCheck();
    });
  }

  private applyRenderState(
    latestCandle: ChartCandle | null,
    renderedBoxAreas: RenderedBoxArea[],
    renderedLineLabels: RenderedLineLabel[],
  ): void {
    this.ngZone.run(() => {
      this.latestCandle = latestCandle;
      this.renderedBoxAreas = this.resolvedConfig().showOverlayLabels ? renderedBoxAreas : [];
      this.renderedLineLabels = this.resolvedConfig().showOverlayLabels ? renderedLineLabels : [];
      this.changeDetectorRef.markForCheck();
    });
  }

  private resolveMode(): CandleChartMode {
    return this.mode ?? this.config.mode ?? 'HISTORICAL';
  }

  private resolvedConfig(): ResolvedCandleChartConfig {
    const mode = this.resolveMode();
    return {
      showCandles: true,
      showVolume: true,
      showLines: true,
      showBoxAreas: true,
      showPoints: true,
      showIndicators: true,
      showRules: true,
      showStrategySignals: true,
      showOverlayLabels: false,
      showHeader: true,
      showToolbar: true,
      showReplayControls: mode === 'REPLAY',
      showDebugPanel: false,
      showAttribution: true,
      showLastPriceLine: true,
      showPriceAxisLabels: false,
      showPreviewBar: true,
      autoScrollToRealtime: true,
      lazyLoadOnPan: false,
      lazyLoadThresholdBars: 24,
      preserveViewportOnDataUpdate: false,
      evaluateOnBarChange: false,
      evaluateOnClosedCandleOnly: true,
      evaluateLivePreview: false,
      height: 520,
      theme: 'AUTO',
      ...this.config,
      symbol: this.symbol ?? this.config.symbol,
      timeframe: this.timeframe ?? this.config.timeframe ?? this.config.interval,
      mode,
    };
  }

  private resolveInputCandles(): ChartCandle[] {
    return this.candles
      ? this.candles.map((candle, index) => ({ ...candle, index: candle.index ?? index }))
      : this.legacyAdapter.candles(this.data);
  }

  private resolveInputIndicators(): ChartIndicator[] {
    if (!this.overlayFilters()['indicators']) {
      return [];
    }
    return this.indicators ?? this.legacyAdapter.indicators(this.data);
  }

  private resolveInputOverlays(): ChartOverlay[] {
    return this.overlays ?? this.legacyAdapter.overlays(this.data);
  }

  private resolveAllOverlays(): ChartOverlay[] {
    return [...this.resolveInputOverlays(), ...this.realtimeOverlayBuffer, ...this.evaluationOverlays].filter((overlay) =>
      this.overlayAllowed(overlay),
    );
  }

  private overlayAllowed(overlay: ChartOverlay): boolean {
    const filters = this.overlayFilters();
    if (!filters['failedEntries'] && this.overlayMatches(overlay, ['FAIL', 'FAILED', 'REJECT'])) {
      return false;
    }
    if (!filters['stopLoss'] && this.overlayMatches(overlay, ['SL', 'STOP'])) {
      return false;
    }
    if (!filters['takeProfit'] && this.overlayMatches(overlay, ['TP', 'TAKE'])) {
      return false;
    }
    if (!filters['entries'] && this.overlayMatches(overlay, ['ENTRY', 'BUY', 'LONG'])) {
      return false;
    }
    if (!filters['exits'] && this.overlayMatches(overlay, ['EXIT', 'SELL', 'CLOSE'])) {
      return false;
    }
    return true;
  }

  private overlayMatches(overlay: ChartOverlay, tokens: string[]): boolean {
    const text = [overlay.id, overlay.text, overlay.source, overlay.sourceCode, overlay.type, overlay.shape]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    return tokens.some((token) => text.includes(token));
  }

  private filterOverlaysForVisibleIndex(
    overlays: ChartOverlay[],
    mode: CandleChartMode,
    currentIndex: number,
  ): ChartOverlay[] {
    if (mode !== 'REPLAY') {
      return overlays;
    }
    return overlays.filter((overlay) => {
      const index = overlay.index ?? overlay.startIndex ?? overlay.endIndex;
      return index == null || index <= currentIndex;
    });
  }

  private currentReplayConfig(): ReplayConfig {
    return {
      loop: false,
      ...this.replayConfig,
      speedMs: this.store.speedMs(),
    };
  }

  private emitError(message: string, detail?: unknown): void {
    this.store.setStatus('ERROR');
    this.error.emit({ message, detail });
  }

  private handleVisibleRangeChange(range: { from: number; to: number } | null, candleCount: number): void {
    const config = this.resolvedConfig();
    if (!config.lazyLoadOnPan || !range || candleCount <= 0) {
      return;
    }

    const threshold = Math.max(4, config.lazyLoadThresholdBars);
    const candles = this.store.candles();
    const firstCandle = candles[0] ?? null;
    const lastCandle = candles.at(-1) ?? null;
    if (range.from <= threshold) {
      this.emitRangeBoundary('PAST', firstCandle, lastCandle);
      return;
    }
    if (range.to >= candleCount - threshold) {
      this.emitRangeBoundary('FUTURE', firstCandle, lastCandle);
    }
  }

  private emitRangeBoundary(
    direction: CandleChartRangeBoundaryEvent['direction'],
    firstCandle: ChartCandle | null,
    lastCandle: ChartCandle | null,
  ): void {
    const edgeTime = direction === 'PAST' ? firstCandle?.openTime ?? firstCandle?.time : lastCandle?.openTime ?? lastCandle?.time;
    const key = `${direction}:${edgeTime ?? 'none'}`;
    if (key === this.lastRangeBoundaryKey) {
      return;
    }
    const now = Date.now();
    if (now - this.lastRangeBoundaryEmitAt[direction] < 450) {
      return;
    }
    this.lastRangeBoundaryKey = key;
    this.lastRangeBoundaryEmitAt[direction] = now;
    this.ngZone.run(() => this.rangeBoundaryReached.emit({ direction, firstCandle, lastCandle }));
  }

  private readonly onResize = (): void => {
    this.ngZone.runOutsideAngular(() => this.engine.resize(this.chartRef.nativeElement.clientWidth, this.chartHeight));
  };

  private observeThemeChanges(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.themeObserver = new MutationObserver(() => {
      if (this.lastRenderInput) {
        this.engine.refreshTheme(this.lastRenderInput);
      }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }

  private refreshPreviewClock(): void {
    this.previewClockLabel.set(this.buildClockLabel());
  }

  private buildClockLabel(): string {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetRemainder = Math.abs(offsetMinutes) % 60;
    const offset =
      offsetRemainder === 0
        ? `${sign}${offsetHours}`
        : `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetRemainder).padStart(2, '0')}`;

    return `${hours}:${minutes}:${seconds} UTC${offset}`;
  }

  private emptyPayload(): CandleChartPayload {
    return {
      candles: [],
      lines: [],
      boxAreas: [],
      points: [],
      indicators: [],
    };
  }
}
