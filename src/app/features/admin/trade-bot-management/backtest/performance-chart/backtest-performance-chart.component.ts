import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import type { ECharts } from 'echarts';
import { BacktestMetricResponse } from '../../../../../core/models/trade-bot/backtest.model';
import { resolveThemeColor } from '../../../../../shared/utils/theme-colors';

@Component({
  selector: 'app-backtest-performance-chart',
  standalone: false,
  templateUrl: './backtest-performance-chart.component.html',
  styleUrl: './backtest-performance-chart.component.css'
})
export class BacktestPerformanceChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartRef', { static: true })
  chartRef!: ElementRef<HTMLDivElement>;

  @Input() metric: BacktestMetricResponse | null = null;

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
    if (changes['metric']) {
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

    const chartColors = {
      equityLine: resolveThemeColor('--app-chart-success'),
      equityFill: resolveThemeColor('--app-chart-success-fill'),
      drawdownLine: resolveThemeColor('--app-chart-danger'),
      drawdownFill: resolveThemeColor('--app-chart-danger-fill')
    };

    const equityCurve = this.metric?.equityCurve ?? [];
    const drawdownCurve = this.metric?.drawdownCurve ?? [];
    const categories = equityCurve.map((point) => this.formatTime(point.utcTimeStamp));

    this.chartInstance.setOption(
      {
        tooltip: { trigger: 'axis' },
        legend: { top: 10, data: ['Equity', 'Drawdown %'] },
        grid: [{ left: 48, right: 48, top: 48, height: '58%' }, { left: 48, right: 48, top: '72%', height: '16%' }],
        xAxis: [
          { type: 'category', data: categories, boundaryGap: false, axisLabel: { show: false } },
          { type: 'category', gridIndex: 1, data: categories, boundaryGap: false }
        ],
        yAxis: [
          { type: 'value', scale: true, name: 'Equity' },
          { type: 'value', gridIndex: 1, name: 'DD %' }
        ],
        series: [
          {
            name: 'Equity',
            type: 'line',
            data: equityCurve.map((point) => point.value),
            smooth: true,
            showSymbol: false,
            areaStyle: { color: chartColors.equityFill },
            lineStyle: { color: chartColors.equityLine, width: 2 }
          },
          {
            name: 'Drawdown %',
            type: 'line',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: drawdownCurve.map((point) => point.value),
            smooth: true,
            showSymbol: false,
            areaStyle: { color: chartColors.drawdownFill },
            lineStyle: { color: chartColors.drawdownLine, width: 2 }
          }
        ]
      },
      true
    );
  }

  private formatTime(value: number): string {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
