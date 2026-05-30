import { Injectable } from '@angular/core';
import type {
  CandlestickData,
  ChartOptions,
  DeepPartial,
  HistogramData,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  LineWidth,
  MouseEventHandler,
  SeriesMarker,
  Time,
  WhitespaceData,
} from 'lightweight-charts';

import { resolveCssColor, resolveThemeColor } from '../../utils/theme-colors';
import type {
  CandleChartConfig,
  CandleChartRange,
  ChartCandle,
  ChartIndicator,
  ChartOverlay,
  RenderedBoxArea,
  RenderedLineLabel,
  ResolvedCandleChartConfig,
} from './candle-chart.models';
import {
  CandleChartTimeUtil,
  type NormalizedCandle,
  type TimeNormalizationContext,
} from './candle-chart-time.util';

type LightweightChartsModule = typeof import('lightweight-charts');
type SeriesApi = ISeriesApi<any>;

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

export interface CandleChartEngineState {
  latestCandle: ChartCandle | null;
  renderedBoxAreas: RenderedBoxArea[];
  renderedLineLabels: RenderedLineLabel[];
}

export interface CandleChartEngineRenderInput {
  candles: ChartCandle[];
  indicators: ChartIndicator[];
  overlays: ChartOverlay[];
  config: ResolvedCandleChartConfig;
  selectedRange: CandleChartRange;
  forceSetData?: boolean;
  fitContent?: boolean;
}

@Injectable()
export class CandleChartEngineService {
  private lightweightChartsModule: LightweightChartsModule | null = null;
  private chartInstance: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private markersApi: ISeriesMarkersPluginApi<Time> | null = null;
  private indicatorSeries = new Map<string, SeriesApi>();
  private overlaySeries: SeriesApi[] = [];
  private priceLines: IPriceLine[] = [];
  private normalizedCandles: NormalizedCandle[] = [];
  private renderedTimes: string[] = [];
  private activeBoxAreas: NormalizedBoxArea[] = [];
  private activeLines: NormalizedLine[] = [];
  private structureKey = '';
  private overlaySignature = '';
  private hostElement: HTMLDivElement | null = null;
  private renderStateCallback: ((state: CandleChartEngineState) => void) | null = null;
  private candleClickCallback: ((candle: ChartCandle) => void) | null = null;
  private visibleRangeCallback: ((range: { from: number; to: number } | null, candleCount: number) => void) | null = null;
  private viewportUpdateFrame: number | null = null;
  private lastRenderStateSignature = '';
  private overlayGeometryEnabled = false;

  private readonly clickHandler: MouseEventHandler<Time> = (param): void => {
    if (param.time == null) {
      return;
    }
    const sortTime = this.timeUtil.toTimeSortValue(param.time);
    const candle = this.normalizedCandles.find((item) => item.sortTime === sortTime)?.source;
    if (candle) {
      this.candleClickCallback?.(candle);
    }
  };

  constructor(private readonly timeUtil: CandleChartTimeUtil) {}

  async initialize(
    hostElement: HTMLDivElement,
    input: CandleChartEngineRenderInput,
    renderStateCallback: (state: CandleChartEngineState) => void,
    candleClickCallback: (candle: ChartCandle) => void,
    visibleRangeCallback?: (range: { from: number; to: number } | null, candleCount: number) => void,
  ): Promise<void> {
    this.lightweightChartsModule = await import('lightweight-charts');
    this.hostElement = hostElement;
    this.renderStateCallback = renderStateCallback;
    this.candleClickCallback = candleClickCallback;
    this.visibleRangeCallback = visibleRangeCallback ?? null;
    const colors = this.resolveChartColors();
    this.chartInstance = this.lightweightChartsModule.createChart(
      hostElement,
      this.buildChartOptions(colors, input.config),
    );
    this.chartInstance.timeScale().subscribeVisibleLogicalRangeChange(this.scheduleViewportUpdate);
    this.chartInstance.subscribeClick(this.clickHandler);
    this.render(input);
  }

  render(input: CandleChartEngineRenderInput): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    const colors = this.resolveChartColors();
    const wasNearRealtimeEdge = this.isNearRealtimeEdge();
    const normalizedCandles = this.timeUtil.normalizeCandles(input.candles);
    const nextStructureKey = this.buildStructureKey(input, normalizedCandles);
    const resetStructure = nextStructureKey !== this.structureKey;
    const previousVisibleLogicalRange =
      input.fitContent === false ? this.chartInstance.timeScale().getVisibleLogicalRange() : null;
    this.structureKey = nextStructureKey;
    this.normalizedCandles = normalizedCandles;

    this.chartInstance.applyOptions(this.buildChartOptions(colors, input.config));
    this.applyMainPriceScale(colors, input.config);
    if (resetStructure) {
      this.clearAllSeries();
      this.createBaseSeries(input, colors);
      this.setSeriesData(normalizedCandles, input.indicators, colors);
    } else if (input.forceSetData) {
      this.setSeriesData(normalizedCandles, input.indicators, colors);
    } else {
      this.updateSeriesData(normalizedCandles, input.indicators, colors);
    }

    const timeContext = this.timeUtil.buildTimeNormalizationContext(normalizedCandles);
    this.renderOverlays(input.overlays, timeContext, input.config, colors);
    this.applySelectedRange(input.selectedRange, input.fitContent !== false);
    if (input.config.autoScrollToRealtime && input.config.mode === 'REALTIME' && wasNearRealtimeEdge) {
      this.chartInstance.timeScale().scrollToRealTime();
    } else if (previousVisibleLogicalRange && input.fitContent === false) {
      this.chartInstance.timeScale().setVisibleLogicalRange(previousVisibleLogicalRange);
    }
    this.updateViewportState();
  }

  resize(width: number, height: number): void {
    this.chartInstance?.resize(width, height, true);
    this.updateViewportState();
  }

  destroy(): void {
    if (this.viewportUpdateFrame != null) {
      window.cancelAnimationFrame(this.viewportUpdateFrame);
      this.viewportUpdateFrame = null;
    }
    this.chartInstance?.timeScale().unsubscribeVisibleLogicalRangeChange(this.scheduleViewportUpdate);
    this.chartInstance?.unsubscribeClick(this.clickHandler);
    this.clearAllSeries();
    this.chartInstance?.remove();
    this.chartInstance = null;
    this.lightweightChartsModule = null;
    this.hostElement = null;
    this.renderStateCallback = null;
    this.candleClickCallback = null;
    this.visibleRangeCallback = null;
    this.lastRenderStateSignature = '';
    this.overlayGeometryEnabled = false;
  }

  refreshTheme(input: CandleChartEngineRenderInput): void {
    this.structureKey = '';
    this.render(input);
  }

  private createBaseSeries(input: CandleChartEngineRenderInput, colors: CandleChartColors): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }

    this.candleSeries = this.chartInstance.addSeries(
      this.lightweightChartsModule.CandlestickSeries,
      {
        upColor: colors.candleUp,
        downColor: colors.candleDown,
        borderVisible: false,
        wickUpColor: colors.candleUp,
        wickDownColor: colors.candleDown,
        priceLineVisible: input.config.showLastPriceLine,
        priceLineColor: colors.candleUp,
        priceLineStyle: this.lightweightChartsModule.LineStyle.Dotted,
        priceLineWidth: 1,
        visible: input.config.showCandles,
        title: input.config.symbol ?? '',
        lastValueVisible: input.config.showPriceAxisLabels,
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      },
    );

    if (input.config.showVolume) {
      this.volumeSeries = this.chartInstance.addSeries(
        this.lightweightChartsModule.HistogramSeries,
        {
          color: colors.volumeUp,
          priceScaleId: 'volume',
          priceFormat: { type: 'volume' },
          priceLineVisible: false,
          lastValueVisible: input.config.showPriceAxisLabels,
        },
      );
      this.chartInstance.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
        borderColor: colors.border,
      });
    }

    if (input.config.showIndicators) {
      input.indicators.forEach((indicator, index) => {
        if (indicator.visible === false) {
          return;
        }
        const series = this.createIndicatorSeries(indicator, input);
        const isSubchart = indicator.pane === 'SUB' || indicator.pane === 'subchart';
        series.priceScale().applyOptions({
          borderColor: colors.border,
          scaleMargins: {
            top: isSubchart ? 0.12 : 0.08,
            bottom: isSubchart ? 0.12 : input.config.showVolume ? 0.24 : 0.08,
          },
        });
        this.indicatorSeries.set(this.indicatorKey(indicator, index), series);
      });
    }
  }

  private createIndicatorSeries(indicator: ChartIndicator, input: CandleChartEngineRenderInput): SeriesApi {
    const isSubchart = indicator.pane === 'SUB' || indicator.pane === 'subchart';
    const color = resolveCssColor(indicator.color, '--app-chart-violet');
    const paneIndex = isSubchart ? 1 : 0;
    const commonOptions = {
      priceLineVisible: false,
      lastValueVisible: input.config.showOverlayLabels && input.config.showPriceAxisLabels,
      priceFormat: {
        type: 'price' as const,
        precision: 2,
        minMove: 0.01,
      },
      title: input.config.showOverlayLabels ? indicator.name : '',
    };

    if (indicator.type === 'HISTOGRAM') {
      return this.chartInstance!.addSeries(
        this.lightweightChartsModule!.HistogramSeries,
        {
          ...commonOptions,
          color,
        },
        paneIndex,
      );
    }

    if (indicator.type === 'AREA') {
      return this.chartInstance!.addSeries(
        this.lightweightChartsModule!.AreaSeries,
        {
          ...commonOptions,
          lineColor: color,
          topColor: color,
          bottomColor: 'transparent',
          lineWidth: this.resolveIndicatorLineWidth(indicator.name),
        },
        paneIndex,
      );
    }

    return this.chartInstance!.addSeries(
      this.lightweightChartsModule!.LineSeries,
      {
        ...commonOptions,
        color,
        lineWidth: this.resolveIndicatorLineWidth(indicator.name),
        lineStyle: this.resolveIndicatorLineStyle(indicator.name),
        crosshairMarkerVisible: false,
      },
      paneIndex,
    );
  }

  private setSeriesData(
    normalizedCandles: NormalizedCandle[],
    indicators: ChartIndicator[],
    colors: CandleChartColors,
  ): void {
    this.candleSeries?.setData(this.toCandlestickData(normalizedCandles));
    this.volumeSeries?.setData(this.toVolumeData(normalizedCandles, colors));
    indicators.forEach((indicator, index) => {
      this.indicatorSeries
        .get(this.indicatorKey(indicator, index))
        ?.setData(this.toIndicatorData(normalizedCandles, indicator.values));
    });
    this.renderedTimes = normalizedCandles.map((item) => item.key);
  }

  private updateSeriesData(
    normalizedCandles: NormalizedCandle[],
    indicators: ChartIndicator[],
    colors: CandleChartColors,
  ): void {
    const mode = this.resolveUpdateMode(normalizedCandles);
    if (mode === 'set') {
      this.setSeriesData(normalizedCandles, indicators, colors);
      return;
    }

    const latestIndex = normalizedCandles.length - 1;
    const latest = normalizedCandles[latestIndex];
    if (!latest) {
      this.setSeriesData(normalizedCandles, indicators, colors);
      return;
    }

    this.candleSeries?.update(this.toCandlestickItem(latest));
    this.volumeSeries?.update(this.toVolumeItem(latest, colors));
    indicators.forEach((indicator, indicatorIndex) => {
      const value = this.toIndicatorItem(latest, indicator.values[latestIndex]);
      this.indicatorSeries.get(this.indicatorKey(indicator, indicatorIndex))?.update(value);
    });
    this.renderedTimes = normalizedCandles.map((item) => item.key);
  }

  private resolveUpdateMode(normalizedCandles: NormalizedCandle[]): 'set' | 'update' {
    if (this.renderedTimes.length === 0 || normalizedCandles.length === 0) {
      return 'set';
    }

    const nextTimes = normalizedCandles.map((item) => item.key);
    if (nextTimes.length === this.renderedTimes.length + 1) {
      return nextTimes.slice(0, -1).every((time, index) => time === this.renderedTimes[index])
        ? 'update'
        : 'set';
    }

    if (nextTimes.length === this.renderedTimes.length) {
      return nextTimes.slice(0, -1).every((time, index) => time === this.renderedTimes[index])
        ? 'update'
        : 'set';
    }

    return 'set';
  }

  private renderOverlays(
    overlays: ChartOverlay[],
    timeContext: TimeNormalizationContext,
    config: ResolvedCandleChartConfig,
    colors: CandleChartColors,
  ): void {
    if (!this.chartInstance || !this.lightweightChartsModule || !this.candleSeries) {
      return;
    }

    const visibleOverlays = overlays.filter((overlay) => overlay.visible !== false);
    const nextSignature = this.buildOverlaySignature(visibleOverlays, config);
    if (nextSignature === this.overlaySignature) {
      return;
    }

    this.clearOverlayArtifacts();
    this.overlaySignature = nextSignature;
    const markers: Array<SeriesMarker<Time>> = [];
    const boxes: NormalizedBoxArea[] = [];
    const labelLines: NormalizedLine[] = [];

    visibleOverlays.forEach((overlay, index) => {
      const color = resolveCssColor(overlay.color, '--app-chart-warning');
      if (overlay.type === 'MARKER' || overlay.type === 'LABEL') {
        const time = this.resolveOverlayTime(overlay, timeContext, 'nearest');
        const price = this.numberValue(overlay.price);
        if (time == null || price == null) {
          return;
        }
        markers.push({
          time,
          position: 'atPriceMiddle',
          price,
          shape: this.resolveMarkerShape(overlay.shape, overlay.type),
          color,
          ...(config.showOverlayLabels ? { text: overlay.text ?? overlay.sourceCode ?? '' } : {}),
          size: overlay.size ?? 1.15,
        });
        return;
      }

      if (overlay.type === 'PRICE_LINE') {
        const price = this.numberValue(overlay.price);
        if (price == null) {
          return;
        }
        this.priceLines.push(
          this.candleSeries!.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: this.lightweightChartsModule!.LineStyle.Dashed,
            axisLabelVisible: config.showPriceAxisLabels,
            title: config.showOverlayLabels ? overlay.text ?? overlay.sourceCode ?? '' : '',
          }),
        );
        return;
      }

      if (overlay.type === 'BOX') {
        const startTime = this.resolveOverlayStartTime(overlay, timeContext);
        const endTime = this.resolveOverlayEndTime(overlay, timeContext);
        const high = this.numberValue(overlay.high);
        const low = this.numberValue(overlay.low);
        if (startTime == null || endTime == null || high == null || low == null) {
          return;
        }
        const isReversed = this.timeUtil.compareTimes(startTime, endTime) > 0;
        boxes.push({
          key: overlay.id ?? `box-${index}`,
          name: overlay.text ?? overlay.sourceCode,
          color,
          startTime: isReversed ? endTime : startTime,
          endTime: isReversed ? startTime : endTime,
          high,
          low,
        });
        return;
      }

      if (overlay.type === 'TREND_LINE') {
        const normalizedLine = this.normalizeTrendLine(overlay, index, timeContext, color);
        if (!normalizedLine) {
          return;
        }
        labelLines.push(normalizedLine);
        this.drawLineSeries(normalizedLine, colors);
        return;
      }

      if (overlay.type === 'POLYLINE') {
        this.drawPolyline(overlay, timeContext, color, colors);
      }
    });

    this.activeBoxAreas = boxes;
    this.activeLines = labelLines;
    this.overlayGeometryEnabled = config.showOverlayLabels && (boxes.length > 0 || labelLines.some((line) => !!line.name));
    this.markersApi = this.lightweightChartsModule.createSeriesMarkers(this.candleSeries, markers);
  }

  private normalizeTrendLine(
    overlay: ChartOverlay,
    index: number,
    timeContext: TimeNormalizationContext,
    color: string,
  ): NormalizedLine | null {
    let start = this.numberValue(overlay.start ?? overlay.startPrice);
    let end = this.numberValue(overlay.end ?? overlay.endPrice);
    let startTime = this.resolveOverlayStartTime(overlay, timeContext);
    let endTime = this.resolveOverlayEndTime(overlay, timeContext);
    if (start == null || end == null || startTime == null || endTime == null) {
      return null;
    }

    if (this.timeUtil.compareTimes(startTime, endTime) > 0) {
      [start, end] = [end, start];
      [startTime, endTime] = [endTime, startTime];
    }

    if (this.timeUtil.compareTimes(startTime, endTime) === 0) {
      const expandedEndTime = this.timeUtil.nextCandleTime(startTime, timeContext);
      if (expandedEndTime == null) {
        return null;
      }
      endTime = expandedEndTime;
    }

    return {
      key: overlay.id ?? `line-${index}`,
      name: overlay.text ?? overlay.sourceCode ?? '',
      color,
      start,
      end,
      startTime,
      endTime,
    };
  }

  private drawLineSeries(line: NormalizedLine, colors: CandleChartColors): void {
    if (!this.chartInstance || !this.lightweightChartsModule) {
      return;
    }
    const series = this.chartInstance.addSeries(this.lightweightChartsModule.LineSeries, {
      color: line.color,
      lineWidth: 2,
      lineStyle: this.lightweightChartsModule.LineStyle.Dashed,
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
    series.priceScale().applyOptions({ borderColor: colors.border });
    series.setData([
      { time: line.startTime, value: line.start },
      { time: line.endTime, value: line.end },
    ]);
    this.overlaySeries.push(series);
  }

  private drawPolyline(
    overlay: ChartOverlay,
    timeContext: TimeNormalizationContext,
    color: string,
    colors: CandleChartColors,
  ): void {
    if (!this.chartInstance || !this.lightweightChartsModule || !overlay.points?.length) {
      return;
    }
    const data = overlay.points.flatMap((point): LineData<Time>[] => {
      const time = point.index == null ? null : this.timeUtil.timeByIndex(point.index, timeContext);
      const resolvedTime =
        time ?? (point.time == null ? null : this.timeUtil.normalizeExternalTime(point.time, timeContext, 'nearest'));
      const value = this.numberValue(point.price ?? point.value);
      return resolvedTime == null || value == null ? [] : [{ time: resolvedTime, value }];
    });
    if (data.length < 2) {
      return;
    }
    const series = this.chartInstance.addSeries(this.lightweightChartsModule.LineSeries, {
      color,
      lineWidth: 2,
      lineStyle: this.lightweightChartsModule.LineStyle.Solid,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
      title: '',
    });
    series.priceScale().applyOptions({ borderColor: colors.border });
    series.setData(data.sort((left, right) => this.timeUtil.compareTimes(left.time, right.time)));
    this.overlaySeries.push(series);
  }

  private resolveOverlayTime(
    overlay: ChartOverlay,
    timeContext: TimeNormalizationContext,
    boundary: 'floor' | 'ceil' | 'nearest',
  ): Time | null {
    return (
      this.timeUtil.timeByIndex(overlay.index, timeContext) ??
      (overlay.time == null ? null : this.timeUtil.normalizeExternalTime(overlay.time, timeContext, boundary))
    );
  }

  private resolveOverlayStartTime(
    overlay: ChartOverlay,
    timeContext: TimeNormalizationContext,
  ): Time | null {
    return (
      this.timeUtil.timeByIndex(overlay.startIndex, timeContext) ??
      (overlay.startTime == null
        ? this.resolveOverlayTime(overlay, timeContext, 'floor')
        : this.timeUtil.normalizeExternalTime(overlay.startTime, timeContext, 'floor'))
    );
  }

  private resolveOverlayEndTime(
    overlay: ChartOverlay,
    timeContext: TimeNormalizationContext,
  ): Time | null {
    return (
      this.timeUtil.timeByIndex(overlay.endIndex, timeContext) ??
      (overlay.endTime == null
        ? this.resolveOverlayTime(overlay, timeContext, 'ceil')
        : this.timeUtil.normalizeExternalTime(overlay.endTime, timeContext, 'ceil'))
    );
  }

  private clearAllSeries(): void {
    if (!this.chartInstance) {
      return;
    }

    this.clearOverlayArtifacts();
    [...this.indicatorSeries.values()].forEach((series) => this.chartInstance?.removeSeries(series));
    this.indicatorSeries.clear();
    if (this.volumeSeries) {
      this.chartInstance.removeSeries(this.volumeSeries);
      this.volumeSeries = null;
    }
    if (this.candleSeries) {
      this.chartInstance.removeSeries(this.candleSeries);
      this.candleSeries = null;
    }
    this.renderedTimes = [];
    this.activeBoxAreas = [];
    this.activeLines = [];
    this.overlayGeometryEnabled = false;
  }

  private clearOverlayArtifacts(): void {
    this.markersApi?.setMarkers([]);
    this.markersApi = null;
    this.priceLines.forEach((priceLine) => this.candleSeries?.removePriceLine(priceLine));
    this.priceLines = [];
    this.overlaySeries.forEach((series) => this.chartInstance?.removeSeries(series));
    this.overlaySeries = [];
    this.activeBoxAreas = [];
    this.activeLines = [];
    this.overlayGeometryEnabled = false;
    this.overlaySignature = '';
  }

  private applyMainPriceScale(colors: CandleChartColors, config: ResolvedCandleChartConfig): void {
    this.chartInstance?.priceScale('right').applyOptions({
      borderColor: colors.border,
      scaleMargins: {
        top: 0.08,
        bottom: config.showVolume ? 0.24 : 0.08,
      },
    });
  }

  private applySelectedRange(range: CandleChartRange, fitContent: boolean): void {
    if (!this.chartInstance) {
      return;
    }
    if (!fitContent) {
      return;
    }

    const timeScale = this.chartInstance.timeScale();
    if (range === 'ALL' || this.normalizedCandles.length === 0) {
      timeScale.fitContent();
      return;
    }

    const lastIndex = this.normalizedCandles.length - 1;
    const startIndex = this.resolveRangeStartIndex(range, lastIndex);
    timeScale.setVisibleLogicalRange({
      from: Math.max(0, startIndex - 1),
      to: lastIndex + 4,
    });
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

  private readonly scheduleViewportUpdate = (): void => {
    if (this.viewportUpdateFrame != null) {
      return;
    }
    this.viewportUpdateFrame = window.requestAnimationFrame(() => {
      this.viewportUpdateFrame = null;
      this.updateViewportState();
    });
  };

  private updateViewportState(): void {
    if (!this.chartInstance || !this.candleSeries || !this.hostElement) {
      this.emitRenderState({
        latestCandle: null,
        renderedBoxAreas: [],
        renderedLineLabels: [],
      });
      return;
    }

    const timeScale = this.chartInstance.timeScale();
    this.visibleRangeCallback?.(timeScale.getVisibleLogicalRange(), this.normalizedCandles.length);
    const latestCandle = this.normalizedCandles.at(-1)?.source ?? null;
    if (!this.overlayGeometryEnabled) {
      this.emitRenderState({
        latestCandle,
        renderedBoxAreas: [],
        renderedLineLabels: [],
      });
      return;
    }

    const chartWidth = this.hostElement.clientWidth;
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
          name: area.name,
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

    const nextLineLabels = this.activeLines.flatMap((line) => {
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
      if (
        Math.max(startCoordinate, endCoordinate) < -16 ||
        Math.min(startCoordinate, endCoordinate) > chartWidth + 16 ||
        Math.abs(endCoordinate - startCoordinate) < 18
      ) {
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
    });

    this.emitRenderState({
      latestCandle,
      renderedBoxAreas: nextAreas,
      renderedLineLabels: nextLineLabels,
    });
  }

  private emitRenderState(state: CandleChartEngineState): void {
    const signature = this.renderStateSignature(state);
    if (signature === this.lastRenderStateSignature) {
      return;
    }
    this.lastRenderStateSignature = signature;
    this.renderStateCallback?.(state);
  }

  private renderStateSignature(state: CandleChartEngineState): string {
    const latest = state.latestCandle;
    const latestKey = latest
      ? `${latest.openTime ?? latest.time}:${latest.open}:${latest.high}:${latest.low}:${latest.close}:${latest.volume ?? ''}`
      : '';
    const areasKey = state.renderedBoxAreas
      .map((area) => `${area.key}:${area.style['left']}:${area.style['top']}:${area.style['width']}:${area.style['height']}:${area.style['background']}:${area.style['borderColor']}`)
      .join('|');
    const labelsKey = state.renderedLineLabels
      .map((label) => `${label.key}:${label.style['left']}:${label.style['top']}:${label.style['color']}`)
      .join('|');
    return `${latestKey}::${areasKey}::${labelsKey}`;
  }

  private buildChartOptions(
    colors: CandleChartColors,
    config: ResolvedCandleChartConfig,
  ): DeepPartial<ChartOptions> {
    if (!this.lightweightChartsModule) {
      return {};
    }

    return {
      autoSize: true,
      height: config.height,
      layout: {
        background: { type: this.lightweightChartsModule.ColorType.Solid, color: colors.background },
        textColor: colors.muted,
        fontSize: 12,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        panes: {
          separatorColor: colors.border,
          separatorHoverColor: colors.crosshair,
        },
        attributionLogo: config.showAttribution,
      },
      grid: {
        vertLines: { color: colors.grid, style: this.lightweightChartsModule.LineStyle.Solid },
        horzLines: { color: colors.grid, style: this.lightweightChartsModule.LineStyle.Solid },
      },
      crosshair: {
        mode: this.lightweightChartsModule.CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, labelBackgroundColor: colors.border },
        horzLine: { color: colors.crosshair, labelBackgroundColor: colors.border },
      },
      leftPriceScale: { visible: false, borderColor: colors.border },
      rightPriceScale: { visible: true, borderColor: colors.border },
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
    return normalizedCandles.map((item) => this.toCandlestickItem(item));
  }

  private toCandlestickItem(item: NormalizedCandle): CandlestickData<Time> {
    return {
      time: item.time,
      open: item.source.open,
      high: item.source.high,
      low: item.source.low,
      close: item.source.close,
    };
  }

  private toVolumeData(
    normalizedCandles: NormalizedCandle[],
    colors: CandleChartColors,
  ): HistogramData<Time>[] {
    return normalizedCandles.map((item) => this.toVolumeItem(item, colors));
  }

  private toVolumeItem(item: NormalizedCandle, colors: CandleChartColors): HistogramData<Time> {
    return {
      time: item.time,
      value: item.source.volume ?? 0,
      color: item.source.close >= item.source.open ? colors.volumeUp : colors.volumeDown,
    };
  }

  private toIndicatorData(
    normalizedCandles: NormalizedCandle[],
    values: Array<number | null>,
  ): Array<LineData<Time> | HistogramData<Time> | WhitespaceData<Time>> {
    return normalizedCandles.map((item, index) => this.toIndicatorItem(item, values[index]));
  }

  private toIndicatorItem(
    item: NormalizedCandle,
    value: number | null | undefined,
  ): LineData<Time> | HistogramData<Time> | WhitespaceData<Time> {
    return value == null || Number.isNaN(Number(value))
      ? { time: item.time }
      : { time: item.time, value: Number(value) };
  }

  private buildStructureKey(input: CandleChartEngineRenderInput, normalizedCandles: NormalizedCandle[]): string {
    return JSON.stringify({
      showCandles: input.config.showCandles,
      showVolume: input.config.showVolume,
      showIndicators: input.config.showIndicators,
      showAttribution: input.config.showAttribution,
      labels: input.config.showOverlayLabels,
      priceLabels: input.config.showPriceAxisLabels,
      indicators: input.indicators.map((indicator) => ({
        code: indicator.code,
        name: indicator.name,
        pane: indicator.pane,
        type: indicator.type ?? 'LINE',
        color: indicator.color,
        visible: indicator.visible !== false,
      })),
      empty: normalizedCandles.length === 0,
    });
  }

  private buildOverlaySignature(overlays: ChartOverlay[], config: ResolvedCandleChartConfig): string {
    return JSON.stringify({
      labels: config.showOverlayLabels,
      priceLabels: config.showPriceAxisLabels,
      overlays: overlays.map((overlay, index) => ({
        id: overlay.id ?? `${overlay.type}-${index}`,
        type: overlay.type,
        category: overlay.category,
        source: overlay.source,
        sourceCode: overlay.sourceCode,
        index: overlay.index,
        time: overlay.time,
        price: overlay.price,
        start: overlay.start,
        end: overlay.end,
        startPrice: overlay.startPrice,
        endPrice: overlay.endPrice,
        startIndex: overlay.startIndex,
        endIndex: overlay.endIndex,
        startTime: overlay.startTime,
        endTime: overlay.endTime,
        low: overlay.low,
        high: overlay.high,
        points: overlay.points,
        text: config.showOverlayLabels ? overlay.text : '',
        color: overlay.color,
        shape: overlay.shape,
        size: overlay.size,
        visible: overlay.visible,
      })),
    });
  }

  private isNearRealtimeEdge(thresholdBars = 3): boolean {
    if (!this.chartInstance || this.normalizedCandles.length === 0) {
      return true;
    }
    const range = this.chartInstance.timeScale().getVisibleLogicalRange();
    if (!range) {
      return true;
    }
    const lastIndex = this.normalizedCandles.length - 1;
    return range.to >= lastIndex - thresholdBars;
  }

  private indicatorKey(indicator: ChartIndicator, index: number): string {
    return `${indicator.code ?? indicator.name}-${index}`;
  }

  private resolveIndicatorLineWidth(name: string): LineWidth {
    const normalized = name.toLowerCase();
    return normalized.includes('middle') || normalized.includes('overbought') || normalized.includes('oversold')
      ? 1
      : 2;
  }

  private resolveIndicatorLineStyle(name: string): number {
    const normalized = name.toLowerCase();
    return normalized.includes('overbought') || normalized.includes('oversold')
      ? this.lightweightChartsModule!.LineStyle.Dashed
      : this.lightweightChartsModule!.LineStyle.Solid;
  }

  private resolveMarkerShape(shape: string | undefined, type: ChartOverlay['type']): SeriesMarker<Time>['shape'] {
    const normalized = String(shape ?? '').trim();
    if (normalized === 'arrowUp' || normalized === 'arrowDown' || normalized === 'square') {
      return normalized;
    }
    return type === 'LABEL' ? 'square' : 'circle';
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

  private numberValue(value: unknown): number | null {
    if (value == null) {
      return null;
    }
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }
}
