import type { AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '@core/i18n/i18n.service';
import * as echarts from 'echarts';
import { buildEquityTableConfig } from '../../models/quant-backtest.config';
import type { QuantEquityPointDto } from '../../models/quant-backtest.dto';

@Component({
  selector: 'app-equity-chart',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equity-chart.component.html',
  styleUrl: './equity-chart.component.css',
})
export class EquityChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly i18n = inject(I18nService);

  @ViewChild('chartContainer') chartContainer?: ElementRef<HTMLDivElement>;

  @Input() points: QuantEquityPointDto[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() initialCapital: number | string = 0;

  readonly showDataTable = signal(false);
  readonly tableConfig = buildEquityTableConfig();
  private chartInstance: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['points'] || changes['loading']) && this.chartInstance) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chartInstance?.dispose();
    this.chartInstance = null;
  }

  toggleDataTable(): void {
    this.showDataTable.update((value) => !value);
  }

  get summaryText(): string {
    if (!this.points.length) {
      return this.i18n.t('quantBacktest.detail.chart.noPoints');
    }
    const first = this.points[0]?.equity ?? (Number(this.initialCapital) || 0);
    const last = this.points[this.points.length - 1]?.equity ?? first;
    const profit = last - first;
    const profitPercent = first > 0 ? ((profit / first) * 100).toFixed(2) : '0.00';
    const minimumEquity = Math.min(...this.points.map((point) => point.equity));
    const maximumDrawdown = Math.min(...this.points.map((point) => point.drawdown ?? 0));
    return [
      `${this.i18n.t('quantBacktest.detail.chart.points')}: ${this.points.length}`,
      `${this.i18n.t('quantBacktest.detail.chart.endingEquity')}: ${last.toLocaleString()} (${profit >= 0 ? '+' : ''}${profitPercent}%)`,
      `${this.i18n.t('quantBacktest.detail.chart.lowestEquity')}: ${minimumEquity.toLocaleString()}`,
      `${this.i18n.t('quantBacktest.detail.chart.maxDrawdown')}: ${(maximumDrawdown * 100).toFixed(2)}%`,
    ].join(' · ');
  }

  private initChart(): void {
    const container = this.chartContainer?.nativeElement;
    if (!container) {
      return;
    }
    this.chartInstance = echarts.init(container);
    this.updateChart();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.chartInstance?.resize());
      this.resizeObserver.observe(container);
    }
  }

  private updateChart(): void {
    const chart = this.chartInstance;
    const container = this.chartContainer?.nativeElement;
    if (!chart || !container) {
      return;
    }
    if (!this.points.length) {
      chart.clear();
      return;
    }

    const styles = getComputedStyle(container);
    const token = (name: string, fallback: string) =>
      styles.getPropertyValue(name).trim() || fallback;
    const timestamps = this.points.map((point) =>
      new Date(point.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const values = Array.isArray(params) ? params : [params];
          const first = values[0] as { dataIndex: number; name: string } | undefined;
          const point = first ? this.points[first.dataIndex] : undefined;
          if (!first || !point) {
            return '';
          }
          return [
            first.name,
            `${this.i18n.t('quantBacktest.detail.chart.equity')}: ${point.equity.toLocaleString()}`,
            `${this.i18n.t('quantBacktest.detail.chart.drawdown')}: ${(point.drawdown * 100).toFixed(2)}%`,
          ].join('<br/>');
        },
      },
      grid: {
        left: '2%',
        right: '3%',
        bottom: '8%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLine: {
          lineStyle: { color: token('--app-chart-axis', 'currentColor') },
        },
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: {
          lineStyle: { color: token('--app-chart-axis', 'currentColor') },
        },
        splitLine: {
          lineStyle: { color: token('--app-chart-grid', 'currentColor') },
        },
        axisLabel: {
          formatter: (value: number) => value.toLocaleString(),
          fontSize: 11,
        },
      },
      series: [
        {
          name: this.i18n.t('quantBacktest.detail.chart.equity'),
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: this.points.map((point) => point.equity),
          itemStyle: {
            color: token('--app-chart-primary', 'currentColor'),
          },
          areaStyle: {
            color: token('--app-chart-primary-fill', 'transparent'),
          },
        },
      ],
    } satisfies echarts.EChartsOption);
  }
}
