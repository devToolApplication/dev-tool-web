import { Component, Input } from '@angular/core';
import { TradeBotCandleResponse } from '../../../core/models/trade-bot/chart-query.model';
import { CandleChartConfig } from '../../component/candle-chart/candle-chart';

type CandleChartPreviewSurface = 'default' | 'strong';

@Component({
  selector: 'app-candle-chart-preview',
  standalone: false,
  templateUrl: './candle-chart-preview.component.html',
  styleUrl: './candle-chart-preview.component.css'
})
export class CandleChartPreviewComponent {
  @Input() response: TradeBotCandleResponse | null = null;
  @Input() loading = false;
  @Input() title = '';
  @Input() description = '';
  @Input() emptyLabel = 'noDataFound';
  @Input() surface: CandleChartPreviewSurface = 'default';
  @Input() config: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true
  };

  get hasData(): boolean {
    return (this.response?.candlestickData?.length ?? 0) > 0;
  }
}
