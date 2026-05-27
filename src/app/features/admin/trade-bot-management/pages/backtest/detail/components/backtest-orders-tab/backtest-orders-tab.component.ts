import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BacktestOrderResponse, BacktestPositionResponse } from '../../../../../../../../core/models/trade-bot/trading-system.model';
import { TableConfig } from '../../../../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-backtest-orders-tab',
  standalone: false,
  templateUrl: './backtest-orders-tab.component.html'
})
export class BacktestOrdersTabComponent {
  @Input() orders: BacktestOrderResponse[] = [];
  @Input() fills: BacktestOrderResponse[] = [];
  @Input() positions: BacktestPositionResponse[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() retry = new EventEmitter<void>();

  readonly orderTableConfig: TableConfig = {
    title: 'tradeBot.backtest.orders',
    columns: [
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'tradeId', header: 'tradeBot.field.tradeId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'type', header: 'tradeBot.field.type' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'price', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'fee', header: 'tradeBot.field.fee', type: 'number' },
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'orderTime', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '100rem'
  };

  readonly positionTableConfig: TableConfig = {
    title: 'tradeBot.backtest.positions',
    columns: [
      { field: 'positionId', header: 'tradeBot.field.positionId', type: 'copyable', minWidth: '18rem' },
      { field: 'tradeId', header: 'tradeBot.field.tradeId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'exitPrice', header: 'tradeBot.field.exitPrice', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'pnl', header: 'tradeBot.field.pnl', type: 'semantic-number' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '82rem'
  };
}
