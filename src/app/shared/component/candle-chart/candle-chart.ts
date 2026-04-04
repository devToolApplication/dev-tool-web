import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import type { ECharts } from 'echarts';

export interface CandleData {
  time: string;
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
  startTime: string;
  endTime: string;
}

export interface ChartBoxArea {
  name: string;
  color: string;
  startTime: string;
  endTime: string;
  high: number;
  low: number;
}

export interface ChartPoint {
  name: string;
  color: string;
  startTime: string;
  price: number;
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

  @Input() config: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true,
  };
  @Input() data: CandleChartPayload = {
    candles: [],
    lines: [],
    boxAreas: [],
    points: [],
    indicators: [],
  };

  private echartsModule: typeof import('echarts') | null = null;
  private chartInstance: ECharts | null = null;

  ngAfterViewInit(): void {
    void this.initializeChart();
    window.addEventListener('resize', this.onResize);
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
    window.removeEventListener('resize', this.onResize);
    this.chartInstance?.dispose();
    this.chartInstance = null;
  }

  private async initializeChart(): Promise<void> {
    this.echartsModule = await import('echarts');
    this.chartInstance = this.echartsModule.init(this.chartRef.nativeElement);
    this.render();
  }

  private readonly onResize = (): void => {
    this.chartInstance?.resize();
  };

  private render(): void {
    if (!this.chartInstance) {
      return;
    }

    const xAxis = this.data.candles.map((item) => item.time);
    const candleValues = this.data.candles.map((item) => [
      item.open,
      item.close,
      item.low,
      item.high,
    ]);
    const volumeValues = this.data.candles.map((item) => item.volume ?? 0);
    const overlayIndicators = this.config.showIndicators
      ? this.data.indicators.filter((indicator) => indicator.pane === 'overlay')
      : [];
    const subchartIndicators = this.config.showIndicators
      ? this.data.indicators.filter((indicator) => indicator.pane === 'subchart')
      : [];
    const hasVolumePane = this.config.showVolume;
    const hasIndicatorPane = subchartIndicators.length > 0;
    const bottomAxisIndex = hasIndicatorPane ? (hasVolumePane ? 2 : 1) : hasVolumePane ? 1 : 0;

    const lineSeries = this.config.showLines
      ? this.data.lines.map((line, index) => ({
          name: line.name || `Line ${index + 1}`,
          type: 'line' as const,
          data: [
            [line.startTime, line.start],
            [line.endTime, line.end],
          ],
          showSymbol: false,
          lineStyle: {
            width: 2,
            type: 'dashed',
            color: line.color,
          },
          encode: { x: 0, y: 1 },
          tooltip: { show: false },
          silent: true,
        }))
      : [];

    const boxAreaSeries = this.config.showBoxAreas && this.data.boxAreas.length > 0
      ? [{
          name: 'Areas',
          type: 'line' as const,
          data: [],
          showSymbol: false,
          silent: true,
          lineStyle: {
            opacity: 0,
          },
          markArea: {
            silent: true,
            label: {
              show: true,
              position: 'insideMiddleTop',
              color: '#0f172a',
              fontWeight: 600,
            },
            data: this.data.boxAreas.map((box) => ([
              {
                name: box.name,
                coord: [box.startTime, box.high],
                itemStyle: { color: box.color },
              },
              {
                coord: [box.endTime, box.low],
              },
            ])),
          },
          tooltip: { show: false },
        }]
      : [];

    const overlayIndicatorSeries = overlayIndicators.map((indicator) => ({
      name: indicator.name,
      type: 'line' as const,
      data: indicator.values.map((value, index) => [xAxis[index], value]),
      showSymbol: false,
      connectNulls: false,
      smooth: false,
      xAxisIndex: 0,
      yAxisIndex: 0,
      lineStyle: {
        width: indicator.name.toLowerCase().includes('middle') ? 1.4 : 1.8,
        color: indicator.color,
        opacity: indicator.name.toLowerCase().includes('rsi ') ? 0.7 : 1,
      },
      encode: { x: 0, y: 1 },
      tooltip: { show: false },
      silent: true,
    }));

    const subchartIndicatorSeries = subchartIndicators.map((indicator) => ({
      name: indicator.name,
      type: 'line' as const,
      data: indicator.values.map((value, index) => [xAxis[index], value]),
      showSymbol: false,
      connectNulls: false,
      smooth: false,
      xAxisIndex: hasVolumePane ? 2 : 1,
      yAxisIndex: hasVolumePane ? 2 : 1,
      lineStyle: {
        width: indicator.name.toLowerCase().includes('overbought') || indicator.name.toLowerCase().includes('oversold') ? 1 : 1.8,
        type: indicator.name.toLowerCase().includes('overbought') || indicator.name.toLowerCase().includes('oversold') ? 'dashed' : 'solid',
        color: indicator.color,
        opacity: indicator.name.toLowerCase().includes('overbought') || indicator.name.toLowerCase().includes('oversold') ? 0.75 : 1,
      },
      encode: { x: 0, y: 1 },
      tooltip: { show: false },
      silent: true,
    }));

    const pointSeries = this.config.showPoints
      ? this.data.points.map((point) => ({
          name: point.name,
          type: 'scatter' as const,
          data: [{ value: [point.startTime, point.price], itemStyle: { color: point.color } }],
          symbolSize: 10,
        }))
      : [];

    const series: any[] = [];

    if (this.config.showCandles) {
      series.push({
        name: 'Candles',
        type: 'candlestick',
        data: candleValues,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: '#22c55e',
          color0: '#ef4444',
          borderColor: '#22c55e',
          borderColor0: '#ef4444',
        },
      });
    }

    series.push(...overlayIndicatorSeries);

    if (this.config.showVolume) {
      series.push({
        name: 'Volume',
        type: 'bar',
        data: volumeValues.map((value, index) => ({
          value,
          itemStyle: {
            color:
              (this.data.candles[index]?.close ?? 0) >= (this.data.candles[index]?.open ?? 0)
                ? 'rgba(34, 197, 94, 0.55)'
                : 'rgba(239, 68, 68, 0.55)',
          },
        })),
        xAxisIndex: 1,
        yAxisIndex: 1,
        barMaxWidth: 12,
      });
    }

    series.push(...subchartIndicatorSeries, ...lineSeries, ...boxAreaSeries, ...pointSeries);

    const grid: any[] = [
      {
        left: 40,
        right: 20,
        top: 40,
        height: hasVolumePane ? (hasIndicatorPane ? '44%' : '58%') : hasIndicatorPane ? '60%' : '74%',
      },
    ];

    if (hasVolumePane) {
      grid.push({
        left: 40,
        right: 20,
        top: hasIndicatorPane ? '58%' : '74%',
        height: hasIndicatorPane ? '12%' : '16%',
      });
    }

    if (hasIndicatorPane) {
      grid.push({
        left: 40,
        right: 20,
        top: hasVolumePane ? '76%' : '72%',
        height: hasVolumePane ? '14%' : '18%',
      });
    }

    const xAxes = grid.map((item, index) => ({
      type: 'category' as const,
      gridIndex: index,
      data: xAxis,
      boundaryGap: true,
      axisLine: { lineStyle: { color: '#64748b' } },
      axisLabel: { show: index === bottomAxisIndex },
      min: 'dataMin',
      max: 'dataMax',
    }));

    const yAxes: any[] = [
      {
        scale: true,
        axisLine: { lineStyle: { color: '#64748b' } },
        splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.2)' } },
      },
    ];

    if (hasVolumePane) {
      yAxes.push({
        gridIndex: 1,
        scale: true,
        axisLine: { lineStyle: { color: '#64748b' } },
        splitLine: { show: false },
      });
    }

    if (hasIndicatorPane) {
      yAxes.push({
        gridIndex: hasVolumePane ? 2 : 1,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#64748b' } },
        splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.14)' } },
      });
    }

    this.chartInstance.setOption(
      {
        animation: true,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        legend: { top: 10 },
        grid,
        toolbox: {
          right: 16,
          feature: {
            dataZoom: {
              yAxisIndex: 'none',
            },
            restore: {},
          },
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: grid.map((_, index) => index),
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
          },
          {
            type: 'slider',
            xAxisIndex: grid.map((_, index) => index),
            filterMode: 'filter',
            height: 24,
            bottom: 8,
          },
        ],
        xAxis: xAxes,
        yAxis: yAxes,
        series,
      },
      true,
    );
  }
}
