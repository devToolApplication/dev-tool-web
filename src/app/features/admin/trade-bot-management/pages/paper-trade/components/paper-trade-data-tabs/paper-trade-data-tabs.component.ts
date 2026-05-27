import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { AppTabItem } from '../../../../../../../shared/component/tabs/tabs.component';
import { TableConfig } from '../../../../../../../shared/ui/table/models/table-config.model';
import {
  PaperTradeEquityPoint,
  PaperTradeEvent,
  PaperTradeFill,
  PaperTradeOrder,
  PaperTradePosition,
  PaperTradeSessionDetail
} from '../../../../data-access/models/paper-trade.model';

@Component({
  selector: 'app-paper-trade-data-tabs',
  standalone: false,
  templateUrl: './paper-trade-data-tabs.component.html'
})
export class PaperTradeDataTabsComponent {
  @Input() sessions: unknown[] = [];
  @Input() orders: PaperTradeOrder[] = [];
  @Input() fills: PaperTradeFill[] = [];
  @Input() positions: PaperTradePosition[] = [];
  @Input() equityCurve: PaperTradeEquityPoint[] = [];
  @Input() events: PaperTradeEvent[] = [];
  @Input() detail: PaperTradeSessionDetail | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() retry = new EventEmitter<void>();
  @Output() loadDetail = new EventEmitter<string>();

  readonly activeTab = 'sessions';
  currentTab = 'sessions';

  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.paper.sessions', value: 'sessions' },
    { label: 'tradeBot.paper.positions', value: 'positions' },
    { label: 'tradeBot.paper.orders', value: 'orders' },
    { label: 'tradeBot.paper.fills', value: 'fills' },
    { label: 'tradeBot.paper.equityCurve', value: 'equity' },
    { label: 'tradeBot.paper.events', value: 'events' },
    { label: 'tradeBot.paper.snapshot', value: 'snapshot' }
  ];

  readonly snapshotFacts = computed(() => {
    const snapshot = this.detail?.snapshot;
    return [
      { label: 'tradeBot.field.snapshotId', value: snapshot?.snapshotId ?? '-' },
      { label: 'tradeBot.field.strategyConfigVersion', value: snapshot?.strategyConfigVersion ?? '-' },
      { label: 'tradeBot.field.executorVersion', value: snapshot?.executorVersion ?? '-' },
      { label: 'tradeBot.field.runtimeVersion', value: snapshot?.runtimeVersion ?? '-' },
      { label: 'tradeBot.field.createdAt', value: snapshot?.snapshotCreatedAt ?? '-' },
      { label: 'tradeBot.paper.configChangedAfterStart', value: snapshot?.configChangedAfterStart ? 'YES' : 'NO' }
    ];
  });

  readonly sessionTableConfig: TableConfig = {
    title: 'tradeBot.paper.sessions',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'interval', header: 'tradeBot.field.timeframe' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode', minWidth: '14rem' },
      { field: 'lastEvaluatedBarTime', header: 'tradeBot.paper.lastBar', type: 'date', minWidth: '13rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [{ label: 'tradeBot.action.detail', icon: 'pi pi-eye', severity: 'info', showLabel: false, onClick: (row) => this.loadDetail.emit(row.sessionId) }]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '68rem'
  };

  readonly orderTableConfig: TableConfig = {
    title: 'tradeBot.paper.orders',
    columns: [
      { field: 'filledAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'filledPrice', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '70rem'
  };

  readonly positionTableConfig: TableConfig = {
    title: 'tradeBot.paper.positions',
    columns: [
      { field: 'openedAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'positionId', header: 'tradeBot.field.positionId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'markPrice', header: 'tradeBot.paper.markPrice', type: 'number' },
      { field: 'stopLoss', header: 'tradeBot.paper.stopLoss', type: 'number' },
      { field: 'takeProfit', header: 'tradeBot.paper.takeProfit', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '76rem'
  };

  readonly fillTableConfig: TableConfig = {
    title: 'tradeBot.paper.fills',
    columns: [
      { field: 'filledAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'price', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'fee', header: 'tradeBot.field.fee', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '70rem'
  };

  readonly eventTableConfig: TableConfig = {
    title: 'tradeBot.paper.events',
    columns: [
      { field: 'eventTime', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'eventType', header: 'tradeBot.field.type', minWidth: '13rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '18rem' },
      { field: 'traceId', header: 'traceId', type: 'copyable', minWidth: '18rem' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '72rem'
  };

  readonly equityTableConfig: TableConfig = {
    title: 'tradeBot.paper.equityCurve',
    columns: [
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'balance', header: 'tradeBot.field.currentBalance', type: 'number' },
      { field: 'availableBalance', header: 'tradeBot.paper.availableBalance', type: 'number' },
      { field: 'lockedBalance', header: 'tradeBot.paper.lockedBalance', type: 'number' },
      { field: 'equity', header: 'tradeBot.field.equity', type: 'number' },
      { field: 'realizedPnl', header: 'tradeBot.paper.realizedPnl', type: 'semantic-number' },
      { field: 'unrealizedPnl', header: 'tradeBot.paper.unrealizedPnl', type: 'semantic-number' },
      { field: 'drawdown', header: 'tradeBot.field.drawdown', type: 'percent' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '78rem'
  };

  snapshotJson(): unknown {
    return this.detail?.snapshot ?? {};
  }
}
