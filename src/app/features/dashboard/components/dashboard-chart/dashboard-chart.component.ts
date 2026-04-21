import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import type { ECharts } from 'echarts';
import { DashboardChartSeries } from '../../dashboard.models';

@Component({
  selector: 'app-dashboard-chart',
  standalone: false,
  templateUrl: './dashboard-chart.component.html',
  styleUrl: './dashboard-chart.component.css'
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartRef', { static: true })
  chartRef!: ElementRef<HTMLDivElement>;

  @Input() series: DashboardChartSeries | null = null;

  private chartInstance: ECharts | null = null;
  private echartsModule: typeof import('echarts') | null = null;

  get hasData(): boolean {
    return Boolean(this.series?.values?.some((value) => Number(value) !== 0));
  }

  ngAfterViewInit(): void {
    void this.initializeChart();
    window.addEventListener('resize', this.onResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series']) {
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
    if (!this.chartInstance || !this.series) {
      return;
    }

    const color = this.series.type === 'line' ? '#2563eb' : '#0f766e';
    this.chartInstance.setOption(
      {
        color: [color],
        tooltip: { trigger: 'axis' },
        grid: { left: 44, right: 16, top: 28, bottom: 36 },
        xAxis: {
          type: 'category',
          boundaryGap: this.series.type === 'bar',
          data: this.series.labels,
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.22)' } },
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        series: [
          {
            name: this.series.title,
            type: this.series.type,
            data: this.series.values,
            smooth: this.series.type === 'line',
            showSymbol: false,
            barMaxWidth: 34,
            areaStyle: this.series.type === 'line' ? { color: 'rgba(37, 99, 235, 0.12)' } : undefined,
            lineStyle: this.series.type === 'line' ? { width: 2 } : undefined,
            itemStyle: { borderRadius: this.series.type === 'bar' ? [4, 4, 0, 0] : 0 }
          }
        ]
      },
      true
    );
  }
}
