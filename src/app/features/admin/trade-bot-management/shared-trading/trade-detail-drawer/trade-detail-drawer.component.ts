import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import {
  BacktestEventResponse,
  BacktestOrderResponse,
  BacktestTradeResponse
} from '../../data-access/models/backtest-review.model';

interface DetailRow {
  label: string;
  value: string | number | null | undefined;
}

@Component({
  selector: 'app-trade-detail-drawer',
  standalone: false,
  templateUrl: './trade-detail-drawer.component.html',
  styleUrl: './trade-detail-drawer.component.css'
})
export class TradeDetailDrawerComponent {
  private readonly tradeSignal = signal<BacktestTradeResponse | null>(null);
  private readonly ordersSignal = signal<BacktestOrderResponse[]>([]);
  private readonly eventsSignal = signal<BacktestEventResponse[]>([]);
  private readonly traceSignal = signal<Record<string, unknown> | null>(null);

  @Input() set trade(value: BacktestTradeResponse | null | undefined) {
    this.tradeSignal.set(value ?? null);
  }

  @Input() set orders(value: BacktestOrderResponse[] | null | undefined) {
    this.ordersSignal.set(value ?? []);
  }

  @Input() set events(value: BacktestEventResponse[] | null | undefined) {
    this.eventsSignal.set(value ?? []);
  }

  @Input() set trace(value: Record<string, unknown> | null | undefined) {
    this.traceSignal.set(value ?? null);
  }

  @Output() close = new EventEmitter<void>();

  readonly activeTrade = this.tradeSignal.asReadonly();
  readonly activeTrace = this.traceSignal.asReadonly();

  readonly detailRows = computed<DetailRow[]>(() => {
    const trade = this.tradeSignal();
    if (!trade) {
      return [];
    }
    return [
      { label: 'tradeBot.field.tradeId', value: trade.tradeId },
      { label: 'tradeBot.field.side', value: trade.side },
      { label: 'tradeBot.field.entryIndex', value: trade.entryIndex },
      { label: 'tradeBot.field.exitIndex', value: trade.exitIndex },
      { label: 'tradeBot.field.entryPrice', value: trade.entryPrice },
      { label: 'tradeBot.field.exitPrice', value: trade.exitPrice },
      { label: 'tradeBot.field.quantity', value: trade.quantity },
      { label: 'tradeBot.field.pnl', value: trade.pnl },
      { label: 'tradeBot.field.status', value: trade.exitReason ?? '-' }
    ];
  });

  readonly matchingOrders = computed(() => {
    const tradeId = this.tradeSignal()?.tradeId;
    return tradeId ? this.ordersSignal().filter((order) => order.tradeId === tradeId) : [];
  });

  readonly matchingEvents = computed(() => {
    const tradeId = this.tradeSignal()?.tradeId;
    return tradeId ? this.eventsSignal().filter((event) => event.data?.['tradeId'] === tradeId || event.message?.includes(tradeId)) : [];
  });
}
