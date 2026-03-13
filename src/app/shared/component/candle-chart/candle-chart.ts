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

type DataSourceMode = 'once' | 'polling' | 'ws';

export interface CandleData {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
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

  @Input() sourceMode: DataSourceMode = 'once';
  @Input() maxCandles = 80;
  @Input() config: CandleChartConfig = {
    showCandles: true,
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
  private readonly wsTickMs = 1500;
  private readonly pollingTickMs = 3000;
  private sourceTimerId: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit(): void {
    void this.initializeChart();
    window.addEventListener('resize', this.onResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chartInstance) {
      return;
    }

    if (changes['sourceMode']) {
      this.bindSource();
      return;
    }

    if (changes['data'] || changes['config']) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.stopSource();
    this.chartInstance?.dispose();
    this.chartInstance = null;
  }

  private async initializeChart(): Promise<void> {
    this.echartsModule = await import('echarts');
    this.chartInstance = this.echartsModule.init(this.chartRef.nativeElement);
    this.bindSource();
  }

  private readonly onResize = (): void => {
    this.chartInstance?.resize();
  };

  private bindSource(): void {
    this.stopSource();
    this.data = this.mockInitialPayload();
    this.render();

    if (this.sourceMode === 'polling') {
      this.sourceTimerId = setInterval(() => {
        const freshCandles = this.mockNextCandles(3);
        const mergedCandles = this.mergeCandles(this.data.candles, freshCandles);
        this.data = {
          ...this.data,
          candles: mergedCandles,
          lines: this.buildLines(mergedCandles),
          boxAreas: this.buildBoxAreas(mergedCandles),
          points: this.buildPoints(mergedCandles),
        };
        this.render();
      }, this.pollingTickMs);
    }

    if (this.sourceMode === 'ws') {
      this.sourceTimerId = setInterval(() => {
        const wsCandles = this.mockNextCandles(2);
        const mergedCandles = this.mergeCandles(this.data.candles, wsCandles);
        this.data = {
          ...this.data,
          candles: mergedCandles,
          lines: this.buildLines(mergedCandles),
          boxAreas: this.buildBoxAreas(mergedCandles),
          points: this.buildPoints(mergedCandles),
        };
        this.render();
      }, this.wsTickMs);
    }
  }

  private stopSource(): void {
    if (!this.sourceTimerId) {
      return;
    }

    clearInterval(this.sourceTimerId);
    this.sourceTimerId = null;
  }

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

    const boxAreaSeries = this.config.showBoxAreas
      ? this.data.boxAreas.map((box) => ({
          name: box.name,
          type: 'line' as const,
          data: [],
          markArea: {
            silent: true,
            itemStyle: { color: box.color },
            data: [[{ coord: [box.startTime, box.high] }, { coord: [box.endTime, box.low] }]],
          },
          tooltip: { show: false },
        }))
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
        itemStyle: {
          color: '#22c55e',
          color0: '#ef4444',
          borderColor: '#22c55e',
          borderColor0: '#ef4444',
        },
      });
    }

    series.push(...lineSeries, ...boxAreaSeries, ...pointSeries);

    this.chartInstance.setOption(
      {
        animation: true,
        tooltip: { trigger: 'axis' },
        legend: { top: 10 },
        grid: { left: 40, right: 20, top: 40, bottom: 35 },
        xAxis: {
          type: 'category',
          data: xAxis,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#64748b' } },
        },
        yAxis: {
          scale: true,
          axisLine: { lineStyle: { color: '#64748b' } },
          splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.2)' } },
        },
        series,
      },
      true,
    );
  }

  private mockInitialPayload(): CandleChartPayload {
    const candles = this.mockCandleHistory(40);
    return {
      candles,
      lines: this.buildLines(candles),
      boxAreas: this.buildBoxAreas(candles),
      points: this.buildPoints(candles),
    };
  }

  private mockCandleHistory(size: number): CandleData[] {
    const now = Date.now();
    const result: CandleData[] = [];
    let seed = 100;

    for (let i = size - 1; i >= 0; i -= 1) {
      const time = new Date(now - i * 60_000);
      const open = seed;
      const close = Number((open + (Math.random() - 0.5) * 5).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * 2).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * 2).toFixed(2));
      seed = close;
      result.push({
        time: this.formatTime(time),
        open,
        close,
        high,
        low,
      });
    }

    return result;
  }

  private mockNextCandles(count: number): CandleData[] {
    const base = this.data.candles.at(-1);
    const startTime = base ? this.parseTime(base.time).getTime() + 60_000 : Date.now();
    let seed = base?.close ?? 100;

    return Array.from({ length: count }, (_, index) => {
      const open = seed;
      const close = Number((open + (Math.random() - 0.5) * 4).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * 1.5).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * 1.5).toFixed(2));
      const time = this.formatTime(new Date(startTime + index * 60_000));
      seed = close;

      return { time, open, close, high, low };
    });
  }

  private mergeCandles(oldCandles: CandleData[], incoming: CandleData[]): CandleData[] {
    const map = new Map(oldCandles.map((item) => [item.time, item]));

    incoming.forEach((item) => map.set(item.time, item));

    return Array.from(map.values())
      .sort((a, b) => this.parseTime(a.time).getTime() - this.parseTime(b.time).getTime())
      .slice(-this.maxCandles);
  }

  private buildLines(candles: CandleData[]): ChartLine[] {
    if (candles.length < 10) {
      return [];
    }

    const first = candles[Math.max(0, candles.length - 30)];
    const second = candles[Math.max(0, candles.length - 15)];
    const latest = candles.at(-1);

    if (!first || !second || !latest) {
      return [];
    }

    return [
      {
        name: 'Trend Support',
        color: '#0ea5e9',
        start: first.low,
        end: second.high,
        startTime: first.time,
        endTime: second.time,
      },
      {
        name: 'Trend Breakout',
        color: '#a855f7',
        start: second.low,
        end: latest.high,
        startTime: second.time,
        endTime: latest.time,
      },
    ];
  }

  private buildBoxAreas(candles: CandleData[]): ChartBoxArea[] {
    if (candles.length < 20) {
      return [];
    }

    const a = candles[candles.length - 20];
    const b = candles[candles.length - 12];
    const c = candles[candles.length - 10];
    const d = candles[candles.length - 4];

    return [
      {
        name: 'Demand Zone',
        color: 'rgba(59, 130, 246, 0.18)',
        startTime: a.time,
        endTime: b.time,
        high: a.high + 1,
        low: a.low - 1,
      },
      {
        name: 'Supply Zone',
        color: 'rgba(244, 63, 94, 0.18)',
        startTime: c.time,
        endTime: d.time,
        high: d.high + 0.5,
        low: c.low - 0.5,
      },
    ];
  }

  private buildPoints(candles: CandleData[]): ChartPoint[] {
    return candles
      .filter((_, index) => index % 6 === 0)
      .slice(-8)
      .map((item, index) => ({
        name: `Signal ${index + 1}`,
        color: index % 2 === 0 ? '#f59e0b' : '#22c55e',
        startTime: item.time,
        price: item.close,
      }));
  }

  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private parseTime(timeValue: string): Date {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
