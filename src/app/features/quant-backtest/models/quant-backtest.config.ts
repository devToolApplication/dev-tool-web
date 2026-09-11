import type { TableConfig } from '@shared/ui/patterns/table';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { ExecutionMode, JobRunStatus, QuantOutcome, TriggerType } from './quant-backtest.dto';
import type {
  QuantEquityPointDto,
  QuantOrderDto,
  QuantSignalDto,
  QuantTradeDto,
} from './quant-backtest.dto';
import type {
  RunOverviewRecord,
  StrategyRecord,
  StrategySchemaField,
} from './quant-backtest.model';

export const SCHEDULE_PRESETS = [
  { label: 'quantBacktest.create.schedule.daily', cron: '0 2 * * *' },
  { label: 'quantBacktest.create.schedule.weekly', cron: '0 0 * * 1' },
  { label: 'quantBacktest.create.schedule.hourly', cron: '0 * * * *' },
  { label: 'quantBacktest.create.schedule.custom', cron: '' },
];

export function buildRunsTableConfig(options: {
  onView: (row: RunOverviewRecord) => void;
}): TableConfig<RunOverviewRecord> {
  return {
    title: 'quantBacktest.runs.table.title',
    emptyTitle: 'quantBacktest.runs.table.emptyTitle',
    emptyDescription: 'quantBacktest.runs.table.emptyDescription',
    errorTitle: 'quantBacktest.runs.table.errorTitle',
    density: 'comfortable',
    pagination: true,
    rowClickable: true,
    rowKey: 'runId',
    columns: [
      {
        field: 'name',
        header: 'quantBacktest.runs.col.runAndStrategy',
        customTemplateKey: 'runAndStrategy',
        minWidth: '220px',
      },
      {
        field: 'jobStatus',
        header: 'quantBacktest.runs.col.jobStatus',
        customTemplateKey: 'jobStatus',
        width: '140px',
        align: 'center',
      },
      {
        field: 'quantOutcome',
        header: 'quantBacktest.runs.col.quantOutcome',
        customTemplateKey: 'quantOutcome',
        width: '140px',
        align: 'center',
      },
      {
        field: 'datasetVersion',
        header: 'quantBacktest.runs.col.datasetAndInstrument',
        customTemplateKey: 'datasetAndInstrument',
        minWidth: '180px',
      },
      {
        field: 'netReturn',
        header: 'quantBacktest.runs.col.netReturn',
        customTemplateKey: 'netReturn',
        width: '130px',
        align: 'right',
      },
      {
        field: 'maxDrawdown',
        header: 'quantBacktest.runs.col.maxDrawdown',
        customTemplateKey: 'maxDrawdown',
        width: '130px',
        align: 'right',
      },
      {
        field: 'tradesCount',
        header: 'quantBacktest.runs.col.trades',
        type: 'number',
        width: '100px',
        align: 'right',
      },
      {
        field: 'startedAt',
        header: 'quantBacktest.runs.col.started',
        type: 'datetime',
        width: '170px',
      },
      {
        field: 'actions',
        header: 'quantBacktest.runs.col.actions',
        type: 'actions',
        width: '110px',
        align: 'center',
        actions: [
          {
            label: 'quantBacktest.runs.action.view',
            id: 'view',
            icon: 'pi pi-eye',
            tooltip: 'quantBacktest.runs.action.viewTooltip',
            variant: 'ghost',
            onClick: options.onView,
          },
        ],
      },
    ],
  };
}

export function buildRunsFilterFields(): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'quantBacktest.runs.filter.keyword',
      type: 'text',
      placeholder: 'quantBacktest.runs.filter.keywordPlaceholder',
    },
    {
      key: 'status',
      label: 'quantBacktest.runs.filter.jobStatus',
      type: 'select',
      options: [
        { label: 'quantBacktest.runs.filter.jobStatusAll', value: null },
        { label: 'quantBacktest.status.PENDING', value: 'PENDING' },
        { label: 'quantBacktest.status.RUNNING', value: 'RUNNING' },
        { label: 'quantBacktest.status.SUCCESS', value: 'SUCCESS' },
        { label: 'quantBacktest.status.FAILED', value: 'FAILED' },
        { label: 'quantBacktest.status.SKIPPED', value: 'SKIPPED' },
        { label: 'quantBacktest.status.TIMEOUT', value: 'TIMEOUT' },
        { label: 'quantBacktest.status.CANCELED', value: 'CANCELED' },
      ],
    },
    {
      key: 'strategyId',
      label: 'quantBacktest.runs.filter.strategy',
      type: 'text',
      placeholder: 'quantBacktest.runs.filter.strategyPlaceholder',
    },
    {
      key: 'instrument',
      label: 'quantBacktest.runs.filter.instrument',
      type: 'text',
      placeholder: 'quantBacktest.runs.filter.instrumentPlaceholder',
    },
    {
      key: 'dateRange',
      label: 'quantBacktest.runs.filter.dateRange',
      type: 'date-range',
      placeholder: 'quantBacktest.runs.filter.dateRangePlaceholder',
    },
    {
      key: 'triggerType',
      label: 'quantBacktest.runs.filter.triggerType',
      type: 'select',
      options: [
        { label: 'quantBacktest.runs.filter.triggerTypeAll', value: null },
        { label: 'quantBacktest.trigger.MANUAL', value: 'MANUAL' },
        { label: 'quantBacktest.trigger.SCHEDULED', value: 'SCHEDULED' },
      ],
    },
  ];
}

export function buildTradesTableConfig(): TableConfig<QuantTradeDto> {
  return {
    title: 'quantBacktest.detail.tabs.trades',
    emptyTitle: 'quantBacktest.detail.trades.emptyTitle',
    emptyDescription: 'quantBacktest.detail.trades.emptyDesc',
    density: 'compact',
    pagination: false,
    rowKey: 'tradeId',
    columns: [
      { field: 'instrumentId', header: 'quantBacktest.runs.filter.instrument', width: '130px' },
      {
        field: 'side',
        header: 'quantBacktest.detail.col.side',
        width: '100px',
        align: 'center',
        customTemplateKey: 'tradeSide',
      },
      {
        field: 'entryTime',
        header: 'quantBacktest.detail.col.entryTime',
        type: 'datetime',
        minWidth: '150px',
      },
      {
        field: 'entryPrice',
        header: 'quantBacktest.detail.col.entryPrice',
        type: 'number',
        width: '110px',
        align: 'right',
      },
      {
        field: 'exitTime',
        header: 'quantBacktest.detail.col.exitTime',
        type: 'datetime',
        minWidth: '150px',
      },
      {
        field: 'exitPrice',
        header: 'quantBacktest.detail.col.exitPrice',
        type: 'number',
        width: '110px',
        align: 'right',
      },
      {
        field: 'quantity',
        header: 'quantBacktest.detail.col.quantity',
        type: 'number',
        width: '110px',
        align: 'right',
      },
      {
        field: 'pnlNet',
        header: 'quantBacktest.detail.col.pnlNet',
        width: '110px',
        align: 'right',
        customTemplateKey: 'tradePnl',
      },
      {
        field: 'fees',
        header: 'quantBacktest.detail.col.fees',
        type: 'number',
        width: '90px',
        align: 'right',
      },
      { field: 'exitReason', header: 'quantBacktest.detail.col.exitReason', minWidth: '130px' },
    ],
  };
}

export function buildOrdersTableConfig(): TableConfig<QuantOrderDto> {
  return {
    title: 'quantBacktest.detail.tabs.orders',
    emptyTitle: 'quantBacktest.detail.orders.emptyTitle',
    emptyDescription: 'quantBacktest.detail.orders.emptyDesc',
    density: 'compact',
    pagination: false,
    rowKey: 'orderId',
    columns: [
      { field: 'orderId', header: 'quantBacktest.detail.col.orderId', minWidth: '160px' },
      { field: 'instrumentId', header: 'quantBacktest.runs.filter.instrument', width: '130px' },
      { field: 'orderType', header: 'quantBacktest.detail.col.orderType', width: '110px' },
      {
        field: 'side',
        header: 'quantBacktest.detail.col.side',
        width: '90px',
        align: 'center',
        customTemplateKey: 'orderSide',
      },
      {
        field: 'status',
        header: 'quantBacktest.detail.col.orderStatus',
        width: '110px',
        align: 'center',
        customTemplateKey: 'orderStatus',
      },
      {
        field: 'price',
        header: 'quantBacktest.detail.col.price',
        type: 'number',
        width: '110px',
        align: 'right',
      },
      {
        field: 'quantity',
        header: 'quantBacktest.detail.col.quantity',
        type: 'number',
        width: '110px',
        align: 'right',
      },
      {
        field: 'timestamp',
        header: 'quantBacktest.detail.col.timestamp',
        type: 'datetime',
        minWidth: '150px',
      },
    ],
  };
}

export function buildSignalsTableConfig(): TableConfig<QuantSignalDto> {
  return {
    title: 'quantBacktest.detail.tabs.signals',
    emptyTitle: 'quantBacktest.detail.signals.emptyTitle',
    emptyDescription: 'quantBacktest.detail.signals.emptyDesc',
    density: 'compact',
    pagination: false,
    rowKey: 'signalId',
    columns: [
      {
        field: 'timestamp',
        header: 'quantBacktest.detail.col.timestamp',
        type: 'datetime',
        minWidth: '160px',
      },
      { field: 'instrumentId', header: 'quantBacktest.runs.filter.instrument', width: '130px' },
      {
        field: 'action',
        header: 'quantBacktest.detail.col.action',
        width: '100px',
        align: 'center',
        customTemplateKey: 'signalAction',
      },
      {
        field: 'strength',
        header: 'quantBacktest.detail.col.strength',
        type: 'number',
        width: '100px',
        align: 'right',
      },
    ],
  };
}

export function buildStrategiesTableConfig(options: {
  onView: (row: StrategyRecord) => void;
}): TableConfig<StrategyRecord> {
  return {
    title: 'quantBacktest.strategies.title',
    emptyTitle: 'quantBacktest.strategies.emptyTitle',
    emptyDescription: 'quantBacktest.strategies.emptyDesc',
    density: 'comfortable',
    pagination: true,
    rowClickable: true,
    rowKey: 'id',
    columns: [
      { field: 'name', header: 'quantBacktest.strategies.col.name', minWidth: '200px' },
      {
        field: 'description',
        header: 'quantBacktest.strategies.col.description',
        minWidth: '260px',
      },
      {
        field: 'configsCount',
        header: 'quantBacktest.strategies.col.configs',
        width: '110px',
        align: 'right',
      },
      {
        field: 'parametersCount',
        header: 'quantBacktest.strategies.col.params',
        width: '110px',
        align: 'right',
      },
      {
        field: 'actions',
        header: 'quantBacktest.runs.col.actions',
        type: 'actions',
        width: '120px',
        align: 'center',
        actions: [
          {
            label: 'quantBacktest.runs.action.view',
            id: 'view',
            icon: 'pi pi-sliders-h',
            tooltip: 'quantBacktest.runs.action.viewTooltip',
            variant: 'ghost',
            onClick: options.onView,
          },
        ],
      },
    ],
  };
}

export function buildEquityTableConfig(): TableConfig<QuantEquityPointDto> {
  return {
    title: 'quantBacktest.detail.chart.accessibleTable',
    emptyTitle: 'quantBacktest.detail.chart.emptyTitle',
    emptyDescription: 'quantBacktest.detail.chart.emptyDesc',
    density: 'compact',
    pagination: false,
    rowKey: (row) => `${row.runId}:${row.timestamp}`,
    columns: [
      {
        field: 'timestamp',
        header: 'quantBacktest.detail.col.timestamp',
        type: 'datetime',
        minWidth: '170px',
      },
      {
        field: 'equity',
        header: 'quantBacktest.detail.col.equity',
        type: 'number',
        align: 'right',
      },
      {
        field: 'cash',
        header: 'quantBacktest.detail.col.cash',
        type: 'number',
        align: 'right',
      },
      {
        field: 'drawdown',
        header: 'quantBacktest.detail.col.drawdown',
        type: 'number',
        align: 'right',
      },
    ],
  };
}

export function buildStrategySchemaTableConfig(): TableConfig<StrategySchemaField> {
  return {
    title: 'quantBacktest.strategies.drawer.parameters',
    emptyTitle: 'quantBacktest.strategies.drawer.noParameters',
    emptyDescription: 'quantBacktest.strategies.drawer.noParametersDesc',
    density: 'compact',
    pagination: false,
    rowKey: 'key',
    columns: [
      {
        field: 'key',
        header: 'quantBacktest.strategies.schema.param',
        minWidth: '150px',
      },
      {
        field: 'type',
        header: 'quantBacktest.strategies.schema.type',
        width: '100px',
      },
      {
        field: 'defaultValue',
        header: 'quantBacktest.strategies.schema.default',
        customTemplateKey: 'schemaDefault',
        width: '120px',
      },
      {
        field: 'description',
        header: 'quantBacktest.strategies.schema.description',
        minWidth: '220px',
      },
    ],
  };
}

export const JOB_STATUS_I18N_MAP: Record<JobRunStatus, string> = {
  PENDING: 'quantBacktest.status.PENDING',
  RUNNING: 'quantBacktest.status.RUNNING',
  SUCCESS: 'quantBacktest.status.SUCCESS',
  FAILED: 'quantBacktest.status.FAILED',
  SKIPPED: 'quantBacktest.status.SKIPPED',
  TIMEOUT: 'quantBacktest.status.TIMEOUT',
  CANCELED: 'quantBacktest.status.CANCELED',
};

export const QUANT_OUTCOME_I18N_MAP: Record<QuantOutcome, string> = {
  COMPLETED: 'quantBacktest.status.COMPLETED',
  FAILED: 'quantBacktest.status.FAILED',
  IN_PROGRESS: 'quantBacktest.status.IN_PROGRESS',
  UNAVAILABLE: 'quantBacktest.status.UNAVAILABLE',
};

export const TRIGGER_TYPE_I18N_MAP: Record<TriggerType, string> = {
  MANUAL: 'quantBacktest.trigger.MANUAL',
  SCHEDULED: 'quantBacktest.trigger.SCHEDULED',
};

export const EXECUTION_MODE_I18N_MAP: Record<ExecutionMode, string> = {
  RUN_NOW: 'quantBacktest.create.field.modeRunNow',
  SCHEDULE: 'quantBacktest.create.field.modeSchedule',
};

export const SIMULATION_OPTION_I18N_MAP: Record<string, string> = {
  CONSERVATIVE_STOP_FIRST: 'quantBacktest.simulation.CONSERVATIVE_STOP_FIRST',
  BINANCE_USDM_V1: 'quantBacktest.simulation.BINANCE_USDM_V1',
  BINANCE_SPOT_VIP0: 'quantBacktest.simulation.BINANCE_SPOT_VIP0',
  FIXED_BPS: 'quantBacktest.simulation.FIXED_BPS',
  ZERO: 'quantBacktest.simulation.ZERO',
};

export const TRADE_SIDE_I18N_MAP: Record<string, string> = {
  LONG: 'quantBacktest.side.LONG',
  SHORT: 'quantBacktest.side.SHORT',
};

export const ORDER_SIDE_I18N_MAP: Record<string, string> = {
  BUY: 'quantBacktest.side.BUY',
  SELL: 'quantBacktest.side.SELL',
};

export const ORDER_STATUS_I18N_MAP: Record<string, string> = {
  CREATED: 'quantBacktest.orderStatus.CREATED',
  SUBMITTED: 'quantBacktest.orderStatus.SUBMITTED',
  FILLED: 'quantBacktest.orderStatus.FILLED',
  CANCELED: 'quantBacktest.orderStatus.CANCELED',
  CANCELLED: 'quantBacktest.orderStatus.CANCELLED',
  REJECTED: 'quantBacktest.orderStatus.REJECTED',
  EXPIRED: 'quantBacktest.orderStatus.EXPIRED',
  PENDING: 'quantBacktest.orderStatus.PENDING',
  PARTIALLY_FILLED: 'quantBacktest.orderStatus.PARTIALLY_FILLED',
};

export const SIGNAL_ACTION_I18N_MAP: Record<string, string> = {
  BUY: 'quantBacktest.signalAction.BUY',
  SELL: 'quantBacktest.signalAction.SELL',
  CLOSE: 'quantBacktest.signalAction.CLOSE',
  HOLD: 'quantBacktest.signalAction.HOLD',
};
