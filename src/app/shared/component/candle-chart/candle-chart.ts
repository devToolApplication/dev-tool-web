import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
  ViewChild,
} from '@angular/core';
import type {
  CandlestickData,
  ChartOptions,
  DeepPartial,
  HistogramData,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  SeriesMarker,
  Time,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts';
import { resolveCssColor, resolveThemeColor } from '../../utils/theme-colors';

type LightweightChartsModule = typeof import('lightweight-charts');
type CandleChartTime = string | number | Time;
type CandleChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';
type LineWidth = 1 | 2 | 3 | 4;
type TimeBoundary = 'floor' | 'ceil' | 'nearest';

export interface CandleData {
  time: CandleChartTime;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

export interface ChartLine {
  name: string;
  color: string;
  start: number;
  end: number;
  startTime: CandleChartTime;
  endTime: CandleChartTime;
}

export interface ChartBoxArea {
  name?: string;
  color: string;
  startTime: CandleChartTime;
  endTime: CandleChartTime;
  high: number;
  low: number;
}

export interface ChartPoint {
  name: string;
  color: string;
  shape?: string;
  startTime: CandleChartTime;
  price: number;
  size?: number;
}

export interface ChartIndicatorSeries {
  name: string;
  color: string;
  pane: 'overlay' | 'subchart';
  values: Array<number | null>;
}

export interface CandleChartPayload {
  candles: CandleData[];
  lines: ChartLine[];
  boxAreas: ChartBoxArea[];
  points: ChartPoint[];
  indicators: ChartIndicatorSeries[];
}

export interface CandleChartConfig {
  showCandles: boolean;
  showVolume: boolean;
  showLines: boolean;
  showBoxAreas: boolean;
  showPoints: boolean;
  showIndicators: boolean;
  symbol?: string;
  exchange?: string;
  interval?: string;
  height?: number;
  showHeader?: boolean;
  showAttribution?: boolean;
  showLastPriceLine?: boolean;
  showOverlayLabels?: boolean;
  showPriceAxisLabels?: boolean;
  showPreviewBar?: boolean;
  watermark?: string;
}

interface NormalizedCandle {
  source: CandleData;
  time: Time;
  sortTime: number;
  key: string;
}

interface NormalizedBoxArea {
  key: string;
  name?: string;
  color: string;
  startTime: Time;
  endTime: Time;
  high: number;
  low: number;
}

interface NormalizedLine {
  key: string;
  name: string;
  color: string;
  start: number;
  end: number;
  startTime: Time;
  endTime: Time;
}

interface RenderedBoxArea {
  key: string;
  name?: string;
  style: Record<string, string>;
}

interface RenderedLineLabel {
  key: string;
  name: string;
  style: Record<string, string>;
}

interface CandleChartColors {
  background: string;
  muted: string;
  grid: string;
  border: string;
  crosshair: string;
  candleUp: string;
  candleDown: string;
  volumeUp: string;
  volumeDown: string;
}

interface TimeNormalizationContext {
  lookup: Map<string, Time>;
  candles: NormalizedCandle[];
}

@Component({
  selector: 'app-candle-chart',
  standalone: false,
  templateUrl: './candle-chart.html',
  styleUrl: './candle-chart.css',
})
export class CandleChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartRef', { static: true })
  chartRef!: ElementRef<HTMLDivElement>;

  @Input() config: CandleChartConfig = this.defaultConfig();
  @Input() data: CandleChartPayload = this.emptyPayload();

  latestCandle: CandleData | null = null;
  renderedBoxAreas: RenderedBoxArea[] = [];
  renderedLineLabels: RenderedLineLabel[] = [];
  readonly selectedRange = signal<CandleChartRange>('ALL');
  readonly previewClockLabel = signal(this.buildClockLabel());
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

  private lightweightChartsModule: LightweightChartsModule | null = null;
  private chartInstance: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private markersApi: ISeriesMarkersPluginApi<Time> | null = null;
  private renderedSeries: Array<ISeriesApi<any>> = [];
  private normalizedCandles: NormalizedCandle[] = [];
  private activeBoxAreas: NormalizedBoxArea[] = [];
  private activeLines: NormalizedLine[] = [];
  private themeObserver: MutationObserver | null = null;
  private clockIntervalId: number | null = null;
  private destroyed = false;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  get chartHeight(): number {
    return this.config.height ?? 520;
  }

  get showHeader(): boolean {
    return this.config.showHeader !== false;
  }

  get showPreviewBar(): boolean {
    return this.config.showPreviewBar !== false;
  }

  get showOverlayLabels(): boolean {
    return this.config.showOverlayLabels === true;
  }

  get showPriceAxisLabels(): boolean {
    return this.config.showPriceAxisLabels === true;
  }

  get chartTitle(): string {
    return [this.config.symbol, this.config.interval, this.config.exchange].filter(Boolean).join(' - ');
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
    window.addEventListener('resize', this.onResize);
    this.observeThemeChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chartInstance) {
      return;
    }

    if (changes['data'] || changes['config']) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    window.removeEventListener('resize', this.onResize);
    if (this.clockIntervalId != null) {
      window.clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }
    this.themeObserver?.disconnect();
    this.clearSeries();
    this.chartInstance?.timeScale().unsubscribeVisibleLogicalRangeChange(this.updateOverlayGeometry);
    this.chartInstance?.remove();
    this.chartInstance = null;
    this.candleSeries = null;
    this.markersApi = null;
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
    this.applySelectedRange();
  }

  private async initializeChart(): Promise<void> {
    this.lightweightChartsModule = await import('lightweight-charts');
    if (this.destroyed) {
      return;
    }

    const colors = this.resolveChartColors();
    this.chartInstance = this.lightweightChartsModule.createChart(
      this.chartRef.nativeElement,
      this.buildChartOptions(colors),
    );
    this.chartInstance.timeScale().subscribeVisibleLogicalRangeChange(this.updateOverlayGeometry);
    this.render();
  }

  private readonly onResize = (): void => {
    this.chartInstance?.resize(this.chartRef.nativeElement.clientWidth, this.chartHeight, true);
    this.updateOverlayGeometry();
  };

  private readonly updateOverlayGeometry = (): void => {
    if (!this.chartInstance || !this.candleSeries) {
      this.setRenderedBoxAreas([]);
      this.setRenderedLineLabels([]);
      return;
    }

    const timeScale = this.chartInstance.timeScale();
    const chartWidth = this.chartRef.nativeElement.clientWidth;
    const nextAreas = this.activeBoxAreas.flatMap((area) => {
      const startCoordinate = timeScale.timeToCoordinate(area.startTime);
      const endCoordinate = timeScale.timeToCoordinate(area.endTime);
      const highCoordinate = this.candleSeries?.priceToCoordinate(area.high);
      const lowCoordinate = this.candleSeries?.priceToCoordinate(area.low);
      if (
        startCoordinate == null ||
        endCoordinate == null ||
        highCoordinate == null ||
        lowCoordinate == null
      ) {
        return [];
      }

      const left = Math.min(startCoordinate, endCoordinate);
      const top = Math.min(highCoordinate, lowCoordinate);
      const width = Math.max(Math.abs(endCoordinate - startCoordinate), 4);
      const height = Math.max(Math.abs(lowCoordinate - highCoordinate), 6);

      return [
        {
          key: area.key,
          name: this.showOverlayLabels ? area.name : undefined,
          style: {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            background: area.color,
            borderColor: area.color,
          },
        },
      ];
    });

    const nextLineLabels = this.showOverlayLabels
      ? this.activeLines.flatMap((line) => {
          if (!line.name) {
            return [];
          }
          const startCoordinate = timeScale.timeToCoordinate(line.startTime);
          const endCoordinate = timeScale.timeToCoordinate(line.endTime);
          const startPriceCoordinate = this.candleSeries?.priceToCoordinate(line.start);
          const endPriceCoordinate = this.candleSeries?.priceToCoordinate(line.end);
          if (
            startCoordinate == null ||
            endCoordinate == null ||
            startPriceCoordinate == null ||
            endPriceCoordinate == null
          ) {
            return [];
          }
          if (Math.max(startCoordinate, endCoordinate) < -16 || Math.min(startCoordinate, endCoordinate) > chartWidth + 16) {
            return [];
          }
          if (Math.abs(endCoordinate - startCoordinate) < 18) {
            return [];
          }

          return [
            {
              key: line.key,
              name: line.name,
              style: {
                left: `${(startCoordinate + endCoordinate) / 2}px`,
                top: `${(startPriceCoordinate + endPriceCoordinate) / 2}px`,
                color: line.color,
              },
            },
          ];
        })
      : [];

    this.setRenderedBoxAreas(nextAreas);
    this.setRenderedLineLabels(nextLineLabels);
  };

  private render(): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    const colors = this.resolveChartColors();
    const normalizedCandles = this.normalizeCandles(this.data.candles);
    const timeContext = this.buildTimeNormalizationContext(normalizedCandles);
    const latestNormalizedCandle = normalizedCandles.at(-1);

    this.latestCandle = latestNormalizedCandle?.source ?? null;
    this.clearSeries();
    this.normalizedCandles = normalizedCandles;
    this.chartInstance.applyOptions(this.buildChartOptions(colors));
    this.applyMainPriceScale(colors);

    this.candleSeries = this.chartInstance.addSeries(
      this.lightweightChartsModule.CandlestickSeries,
      {
        upColor: colors.candleUp,
        downColor: colors.candleDown,
        borderVisible: false,
        wickUpColor: colors.candleUp,
        wickDownColor: colors.candleDown,
        priceLineVisible: this.config.showLastPriceLine !== false,
        priceLineColor: this.latestTone === 'down' ? colors.candleDown : colors.candleUp,
        priceLineStyle: this.lightweightChartsModule.LineStyle.Dotted,
        priceLineWidth: 1,
        visible: this.config.showCandles,
        title: this.config.symbol ?? '',
        lastValueVisible: this.showPriceAxisLabels,
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      },
    );
    this.trackSeries(this.candleSeries);
    this.candleSeries.setData(this.toCandlestickData(normalizedCandles));

    if (this.config.showVolume) {
      this.renderVolume(normalizedCandles, colors);
    }

    if (this.config.showIndicators) {
      this.renderIndicators(normalizedCandles, colors);
    }

    this.activeLines = this.config.showLines ? this.normalizeLines(this.data.lines, timeContext) : [];
    this.renderLines(colors);

    this.activeBoxAreas = this.config.showBoxAreas
      ? this.normalizeBoxAreas(this.data.boxAreas, timeContext)
      : [];

    if (this.config.showPoints) {
      this.renderPoints(timeContext, colors);
    }

    this.applySelectedRange();
    this.changeDetectorRef.markForCheck();
  }

  private renderVolume(normalizedCandles: NormalizedCandle[], colors: CandleChartColors): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    const volumeSeries = this.chartInstance.addSeries(
      this.lightweightChartsModule.HistogramSeries,
      {
        color: colors.volumeUp,
        priceScaleId: 'volume',
        priceFormat: { type: 'volume' },
        priceLineVisible: false,
        lastValueVisible: this.showPriceAxisLabels,
      },
    );
    this.trackSeries(volumeSeries);
    volumeSeries.setData(this.toVolumeData(normalizedCandles, colors));
    this.chartInstance.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.78,
        bottom: 0,
      },
      borderColor: colors.border,
    });
  }

  private renderIndicators(normalizedCandles: NormalizedCandle[], colors: CandleChartColors): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    this.data.indicators.forEach((indicator) => {
      const isSubchart = indicator.pane === 'subchart';
      const series = this.chartInstance!.addSeries(
        this.lightweightChartsModule!.LineSeries,
        {
          color: resolveCssColor(indicator.color, '--app-chart-violet'),
          lineWidth: this.resolveIndicatorLineWidth(indicator.name),
          lineStyle: this.resolveIndicatorLineStyle(indicator.name),
          lastValueVisible: this.showOverlayLabels && this.showPriceAxisLabels,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
          title: this.showOverlayLabels ? indicator.name : '',
        },
        isSubchart ? 1 : 0,
      );
      this.trackSeries(series);
      series.setData(this.toIndicatorData(normalizedCandles, indicator.values));
      series.priceScale().applyOptions({
        borderColor: colors.border,
        scaleMargins: {
          top: isSubchart ? 0.12 : 0.08,
          bottom: isSubchart ? 0.12 : this.config.showVolume ? 0.24 : 0.08,
        },
      });
    });
  }

  private renderLines(colors: CandleChartColors): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    this.activeLines.forEach((line) => {
      if (this.compareTimes(line.startTime, line.endTime) >= 0) {
        return;
      }

      const series = this.chartInstance!.addSeries(this.lightweightChartsModule!.LineSeries, {
        color: line.color,
        lineWidth: 2,
        lineStyle: this.lightweightChartsModule!.LineStyle.Dashed,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        title: '',
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      });
      this.trackSeries(series);
      series.setData([
        { time: line.startTime, value: line.start },
        { time: line.endTime, value: line.end },
      ]);
      series.priceScale().applyOptions({ borderColor: colors.border });
    });
  }

  private renderPoints(timeContext: TimeNormalizationContext, _colors: CandleChartColors): void {
    if (!this.candleSeries || !this.lightweightChartsModule) {
      return;
    }

    const markers: Array<SeriesMarker<Time>> = this.data.points.map((point) => ({
      time: this.normalizeExternalTime(point.startTime, timeContext, 'floor'),
      position: 'atPriceMiddle',
      price: point.price,
      shape: this.resolveMarkerShape(point.shape),
      color: resolveCssColor(point.color, '--app-chart-warning'),
      ...(this.showOverlayLabels ? { text: point.name } : {}),
      size: point.size ?? 1.15,
    }));

    this.markersApi = this.lightweightChartsModule.createSeriesMarkers(this.candleSeries, markers);
  }

  private clearSeries(): void {
    if (!this.chartInstance) {
      return;
    }

    this.markersApi?.setMarkers([]);
    this.markersApi = null;
    this.renderedSeries.forEach((series) => this.chartInstance?.removeSeries(series));
    this.renderedSeries = [];
    this.candleSeries = null;
    this.normalizedCandles = [];
    this.activeBoxAreas = [];
    this.activeLines = [];
    this.setRenderedBoxAreas([]);
    this.setRenderedLineLabels([]);
  }

  private trackSeries<T extends ISeriesApi<any>>(series: T): T {
    this.renderedSeries.push(series);
    return series;
  }

  private applyMainPriceScale(colors: CandleChartColors): void {
    this.chartInstance?.priceScale('right').applyOptions({
      borderColor: colors.border,
      scaleMargins: {
        top: 0.08,
        bottom: this.config.showVolume ? 0.24 : 0.08,
      },
    });
  }

  private buildChartOptions(colors: CandleChartColors): DeepPartial<ChartOptions> {
    if (!this.lightweightChartsModule) {
      return {};
    }

    return {
      autoSize: true,
      height: this.chartHeight,
      layout: {
        background: {
          type: this.lightweightChartsModule.ColorType.Solid,
          color: colors.background,
        },
        textColor: colors.muted,
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        panes: {
          separatorColor: colors.border,
          separatorHoverColor: colors.crosshair,
        },
        attributionLogo: this.config.showAttribution !== false,
      },
      grid: {
        vertLines: {
          color: colors.grid,
          style: this.lightweightChartsModule.LineStyle.Solid,
        },
        horzLines: {
          color: colors.grid,
          style: this.lightweightChartsModule.LineStyle.Solid,
        },
      },
      crosshair: {
        mode: this.lightweightChartsModule.CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshair,
          labelBackgroundColor: colors.border,
        },
        horzLine: {
          color: colors.crosshair,
          labelBackgroundColor: colors.border,
        },
      },
      leftPriceScale: {
        visible: false,
        borderColor: colors.border,
      },
      rightPriceScale: {
        visible: true,
        borderColor: colors.border,
      },
      timeScale: {
        borderColor: colors.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };
  }

  private toCandlestickData(normalizedCandles: NormalizedCandle[]): CandlestickData<Time>[] {
    return normalizedCandles.map((item) => ({
      time: item.time,
      open: item.source.open,
      high: item.source.high,
      low: item.source.low,
      close: item.source.close,
    }));
  }

  private toVolumeData(
    normalizedCandles: NormalizedCandle[],
    colors: CandleChartColors,
  ): HistogramData<Time>[] {
    return normalizedCandles.map((item) => ({
      time: item.time,
      value: item.source.volume ?? 0,
      color: item.source.close >= item.source.open ? colors.volumeUp : colors.volumeDown,
    }));
  }

  private toIndicatorData(
    normalizedCandles: NormalizedCandle[],
    values: Array<number | null>,
  ): Array<LineData<Time> | WhitespaceData<Time>> {
    return normalizedCandles.map((item, index) => {
      const value = values[index];
      return value == null || Number.isNaN(Number(value))
        ? { time: item.time }
        : { time: item.time, value: Number(value) };
    });
  }

  private normalizeCandles(candles: CandleData[]): NormalizedCandle[] {
    const normalized = candles.map((candle, index) => {
      const sortTime = this.toUnixSeconds(candle.time, index);
      return {
        source: candle,
        time: sortTime as UTCTimestamp,
        sortTime,
        key: String(sortTime),
      };
    });

    const byTime = new Map<string, NormalizedCandle>();
    normalized
      .sort((left, right) => left.sortTime - right.sortTime)
      .forEach((item) => byTime.set(item.key, item));

    return Array.from(byTime.values());
  }

  private applySelectedRange(): void {
    if (!this.chartInstance) {
      return;
    }

    const timeScale = this.chartInstance.timeScale();
    const range = this.selectedRange();
    if (range === 'ALL' || this.normalizedCandles.length === 0) {
      timeScale.fitContent();
      window.requestAnimationFrame(this.updateOverlayGeometry);
      return;
    }

    const lastIndex = this.normalizedCandles.length - 1;
    const startIndex = this.resolveRangeStartIndex(range, lastIndex);
    timeScale.setVisibleLogicalRange({
      from: Math.max(0, startIndex - 1),
      to: lastIndex + 4,
    });
    window.requestAnimationFrame(this.updateOverlayGeometry);
  }

  private resolveRangeStartIndex(range: CandleChartRange, lastIndex: number): number {
    const lastCandle = this.normalizedCandles[lastIndex];
    if (!lastCandle) {
      return 0;
    }

    const startTime = this.resolveRangeStartTime(range, lastCandle.sortTime);
    if (startTime == null) {
      return 0;
    }

    const index = this.normalizedCandles.findIndex((item) => item.sortTime >= startTime);
    return index === -1 ? 0 : index;
  }

  private resolveRangeStartTime(range: CandleChartRange, endTime: number): number | null {
    const daySeconds = 24 * 60 * 60;
    switch (range) {
      case '1D':
        return endTime - daySeconds;
      case '5D':
        return endTime - 5 * daySeconds;
      case '1M':
        return endTime - 30 * daySeconds;
      case '3M':
        return endTime - 90 * daySeconds;
      case '6M':
        return endTime - 180 * daySeconds;
      case 'YTD': {
        const endDate = new Date(endTime * 1000);
        return Date.UTC(endDate.getUTCFullYear(), 0, 1) / 1000;
      }
      case '1Y':
        return endTime - 365 * daySeconds;
      case '5Y':
        return endTime - 5 * 365 * daySeconds;
      case 'ALL':
        return null;
    }
  }

  private buildTimeNormalizationContext(candles: NormalizedCandle[]): TimeNormalizationContext {
    const lookup = new Map<string, Time>();
    candles.forEach((item) => {
      lookup.set(String(item.source.time), item.time);
      lookup.set(item.key, item.time);
      lookup.set(String(item.sortTime * 1000), item.time);
    });
    return { lookup, candles };
  }

  private normalizeBoxAreas(
    boxAreas: ChartBoxArea[],
    timeContext: TimeNormalizationContext,
  ): NormalizedBoxArea[] {
    return boxAreas.map((box, index) => {
      const startTime = this.normalizeExternalTime(box.startTime, timeContext, 'floor');
      const endTime = this.normalizeExternalTime(box.endTime, timeContext, 'ceil');
      const isReversed = this.compareTimes(startTime, endTime) > 0;

      return {
        key: `${String(box.startTime)}-${String(box.endTime)}-${index}`,
        name: box.name,
        color: resolveCssColor(box.color, '--app-chart-primary-fill'),
        startTime: isReversed ? endTime : startTime,
        endTime: isReversed ? startTime : endTime,
        high: box.high,
        low: box.low,
      };
    });
  }

  private normalizeLines(lines: ChartLine[], timeContext: TimeNormalizationContext): NormalizedLine[] {
    return lines.flatMap((line, index) => {
      let start = line.start;
      let end = line.end;
      let startTime = this.normalizeExternalTime(line.startTime, timeContext, 'floor');
      let endTime = this.normalizeExternalTime(line.endTime, timeContext, 'ceil');

      if (this.compareTimes(startTime, endTime) > 0) {
        [start, end] = [end, start];
        [startTime, endTime] = [endTime, startTime];
      }

      if (this.compareTimes(startTime, endTime) === 0) {
        const expandedEndTime = this.nextCandleTime(startTime, timeContext);
        if (expandedEndTime == null) {
          return [];
        }
        endTime = expandedEndTime;
      }

      return [
        {
          key: `${String(line.startTime)}-${String(line.endTime)}-${index}`,
          name: line.name,
          color: resolveCssColor(line.color, '--app-chart-primary'),
          start,
          end,
          startTime,
          endTime,
        },
      ];
    });
  }

  private normalizeExternalTime(
    value: CandleChartTime,
    timeContext: TimeNormalizationContext,
    boundary: TimeBoundary,
  ): Time {
    const directMatch = timeContext.lookup.get(String(value));
    if (directMatch != null) {
      return directMatch;
    }

    const sortTime = this.toUnixSeconds(value, 0);
    return this.resolveBoundaryTime(sortTime, timeContext.candles, boundary) ?? (sortTime as UTCTimestamp);
  }

  private toUnixSeconds(value: CandleChartTime, fallbackIndex: number): number {
    if (typeof value === 'number') {
      return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
    }

    const rawValue = String(value ?? '').trim();
    const timeOnly = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeOnly) {
      return (
        Date.UTC(2000, 0, 1, Number(timeOnly[1]), Number(timeOnly[2]), Number(timeOnly[3] ?? 0)) /
        1000
      );
    }

    const parsedTime = Date.parse(rawValue.replace(' ', 'T'));
    if (!Number.isNaN(parsedTime)) {
      return Math.floor(parsedTime / 1000);
    }

    return Date.UTC(2000, 0, 1, 0, fallbackIndex, 0) / 1000;
  }

  private resolveBoundaryTime(
    sortTime: number,
    candles: NormalizedCandle[],
    boundary: TimeBoundary,
  ): Time | null {
    if (candles.length === 0) {
      return null;
    }

    const ceilIndex = this.findFirstCandleIndexAtOrAfter(sortTime, candles);
    const floorIndex = ceilIndex >= candles.length ? candles.length - 1 : Math.max(ceilIndex - 1, 0);

    if (boundary === 'ceil') {
      return candles[Math.min(ceilIndex, candles.length - 1)].time;
    }

    if (boundary === 'floor') {
      if (ceilIndex < candles.length && candles[ceilIndex].sortTime === sortTime) {
        return candles[ceilIndex].time;
      }
      return candles[floorIndex].time;
    }

    const ceilCandle = candles[Math.min(ceilIndex, candles.length - 1)];
    const floorCandle = candles[floorIndex];
    return Math.abs(ceilCandle.sortTime - sortTime) < Math.abs(sortTime - floorCandle.sortTime)
      ? ceilCandle.time
      : floorCandle.time;
  }

  private findFirstCandleIndexAtOrAfter(sortTime: number, candles: NormalizedCandle[]): number {
    let low = 0;
    let high = candles.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (candles[middle].sortTime < sortTime) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
  }

  private nextCandleTime(time: Time, timeContext: TimeNormalizationContext): Time | null {
    const sortTime = this.toTimeSortValue(time);
    const index = timeContext.candles.findIndex((candle) => candle.sortTime > sortTime);
    return index === -1 ? null : timeContext.candles[index].time;
  }

  private compareTimes(left: Time, right: Time): number {
    return this.toTimeSortValue(left) - this.toTimeSortValue(right);
  }

  private toTimeSortValue(time: Time): number {
    if (typeof time === 'number') {
      return time;
    }
    if (typeof time === 'string') {
      const parsed = Date.parse(time.replace(' ', 'T'));
      return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
    }
    return Date.UTC(time.year, time.month - 1, time.day) / 1000;
  }

  private resolveIndicatorLineWidth(name: string): LineWidth {
    const normalized = name.toLowerCase();
    return normalized.includes('middle') ||
      normalized.includes('overbought') ||
      normalized.includes('oversold')
      ? 1
      : 2;
  }

  private resolveIndicatorLineStyle(name: string): number {
    const normalized = name.toLowerCase();
    return normalized.includes('overbought') || normalized.includes('oversold')
      ? this.lightweightChartsModule!.LineStyle.Dashed
      : this.lightweightChartsModule!.LineStyle.Solid;
  }

  private resolveMarkerShape(shape?: string): SeriesMarker<Time>['shape'] {
    const normalized = String(shape ?? '').trim();
    if (normalized === 'arrowUp' || normalized === 'arrowDown' || normalized === 'square') {
      return normalized;
    }
    return 'circle';
  }

  private resolveChartColors(): CandleChartColors {
    return {
      background: resolveThemeColor('--app-finance-chart-bg', '--app-bg'),
      muted: resolveThemeColor('--app-chart-axis', '--app-text-muted'),
      grid: resolveThemeColor('--app-finance-chart-grid', '--app-chart-grid'),
      border: resolveThemeColor('--app-finance-chart-border', '--app-border-soft'),
      crosshair: resolveThemeColor('--app-finance-chart-crosshair', '--app-chart-axis'),
      candleUp: resolveThemeColor('--app-chart-candle-up', '--app-accent-green'),
      candleDown: resolveThemeColor('--app-chart-candle-down', '--app-control-danger-text'),
      volumeUp: resolveThemeColor('--app-chart-volume-up', '--app-chart-candle-up'),
      volumeDown: resolveThemeColor('--app-chart-volume-down', '--app-chart-candle-down'),
    };
  }

  private observeThemeChanges(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.themeObserver = new MutationObserver(() => {
      if (!this.chartInstance) {
        return;
      }
      this.render();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
  }

  private setRenderedBoxAreas(nextAreas: RenderedBoxArea[]): void {
    this.ngZone.run(() => {
      this.renderedBoxAreas = nextAreas;
      this.changeDetectorRef.markForCheck();
    });
  }

  private setRenderedLineLabels(nextLabels: RenderedLineLabel[]): void {
    this.ngZone.run(() => {
      this.renderedLineLabels = nextLabels;
      this.changeDetectorRef.markForCheck();
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

  private defaultConfig(): CandleChartConfig {
    return {
      showCandles: true,
      showVolume: true,
      showLines: true,
      showBoxAreas: true,
      showPoints: true,
      showIndicators: true,
    };
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
