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

export interface CandleChartPayload {
  candles: CandleData[];
  lines: ChartLine[];
  boxAreas: ChartBoxArea[];
  points: ChartPoint[];
}

export interface CandleChartConfig {
  showCandles: boolean;
  showVolume: boolean;
  showLines: boolean;
  showBoxAreas: boolean;
  showPoints: boolean;
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
  };
  @Input() data: CandleChartPayload = {
    candles: [],
    lines: [],
    boxAreas: [],
    points: [],
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

    series.push(...lineSeries, ...boxAreaSeries, ...pointSeries);

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
        grid: [
          { left: 40, right: 20, top: 40, height: '58%' },
          { left: 40, right: 20, top: '74%', height: '16%' },
        ],
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
            xAxisIndex: [0, 1],
            filterMode: 'filter',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: true,
          },
          {
            type: 'slider',
            xAxisIndex: [0, 1],
            filterMode: 'filter',
            height: 24,
            bottom: 8,
          },
        ],
        xAxis: [
          {
            type: 'category',
            data: xAxis,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#64748b' } },
            axisLabel: { show: false },
            min: 'dataMin',
            max: 'dataMax',
          },
          {
            type: 'category',
            gridIndex: 1,
            data: xAxis,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#64748b' } },
            min: 'dataMin',
            max: 'dataMax',
          },
        ],
        yAxis: [
          {
            scale: true,
            axisLine: { lineStyle: { color: '#64748b' } },
            splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.2)' } },
          },
          {
            gridIndex: 1,
            scale: true,
            axisLine: { lineStyle: { color: '#64748b' } },
            splitLine: { show: false },
          },
        ],
        series,
      },
      true,
    );
  }
}
