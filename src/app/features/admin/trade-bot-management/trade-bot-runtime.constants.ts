import { FormConfig } from '../../../shared/ui/form-input/models/form-config.model';

export const TRADE_BOT_ROUTES = {
  marketData: '/admin/trade-bot/market-data',
  indicators: '/admin/trade-bot/indicator-configs',
  rules: '/admin/trade-bot/rule-configs',
  strategies: '/admin/trade-bot/strategy-configs',
  backtests: '/admin/trade-bot/backtests',
  replay: '/admin/trade-bot/replay'
} as const;

export const STATUS_OPTIONS = [
  { label: 'tradeBot.status.active', value: 'ACTIVE' },
  { label: 'tradeBot.status.inactive', value: 'INACTIVE' }
];

export const AUDIT_LEVEL_OPTIONS = [
  { label: 'tradeBot.audit.summary', value: 'SUMMARY' },
  { label: 'tradeBot.audit.tradeTrace', value: 'TRADE_TRACE' },
  { label: 'tradeBot.audit.fullDebug', value: 'FULL_DEBUG' }
];

export const SAME_BAR_OPTIONS = [
  { label: 'tradeBot.sameBar.slFirst', value: 'SL_FIRST' },
  { label: 'tradeBot.sameBar.tpFirst', value: 'TP_FIRST' },
  { label: 'tradeBot.sameBar.skipTrade', value: 'SKIP_TRADE' },
  { label: 'tradeBot.sameBar.intrabar', value: 'USE_INTRABAR_DATA' }
];

export const MARKET_DATA_QUERY_FORM: FormConfig = {
  fields: [
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/4', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/4', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'from', type: 'text', label: 'tradeBot.field.fromTime', width: '1/4' },
    { name: 'to', type: 'text', label: 'tradeBot.field.toTime', width: '1/4' },
    { name: 'limit', type: 'number', label: 'tradeBot.field.limit', suffix: 'bars', width: '1/4' }
  ]
};

export const CANDLE_IMPORT_FORM: FormConfig = {
  fields: [
    {
      name: 'payload',
      type: 'textarea',
      label: 'tradeBot.market.importPayload',
      contentType: 'json',
      rows: 12,
      maxRows: 20,
      showZoomButton: true,
      validation: [{ expression: 'required', message: 'required' }]
    }
  ]
};

export const INDICATOR_FORM: FormConfig = {
  fields: [
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'executorVersion', type: 'text', label: 'tradeBot.field.executorVersion', width: '1/3' },
    { name: 'displayType', type: 'text', label: 'tradeBot.field.displayType', width: '1/3' },
    { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
    { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true },
    { name: 'childrenText', type: 'textarea', label: 'tradeBot.field.childrenJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true },
    { name: 'overlayText', type: 'textarea', label: 'tradeBot.field.overlayJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true }
  ]
};

export const RULE_FORM: FormConfig = {
  fields: [
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'executorVersion', type: 'text', label: 'tradeBot.field.executorVersion', width: '1/3' },
    { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
    { name: 'indicatorsText', type: 'textarea', label: 'tradeBot.field.indicatorsJson', contentType: 'json', rows: 4, maxRows: 10, showZoomButton: true },
    { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true },
    { name: 'childRulesText', type: 'textarea', label: 'tradeBot.field.childRulesJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true },
    { name: 'overlayText', type: 'textarea', label: 'tradeBot.field.overlayJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true }
  ]
};

export const STRATEGY_FORM: FormConfig = {
  fields: [
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'type', type: 'select', label: 'tradeBot.field.type', options: [{ label: 'ENTRY_TP_SL', value: 'ENTRY_TP_SL' }], width: '1/3' },
    { name: 'strategyVersion', type: 'text', label: 'tradeBot.field.strategyVersion', width: '1/3' },
    { name: 'entryRule', type: 'text', label: 'tradeBot.field.entryRule', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'slRule', type: 'text', label: 'tradeBot.field.slRule', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'tpRule', type: 'text', label: 'tradeBot.field.tpRule', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
    { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true }
  ]
};

export const BACKTEST_RUN_FORM: FormConfig = {
  fields: [
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/2', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/2', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'initialBalance', type: 'number', label: 'tradeBot.field.initialBalance', prefix: '$', width: '1/4' },
    { name: 'riskPerTradePct', type: 'number', label: 'tradeBot.field.riskPerTradePct', suffix: '%', width: '1/4' },
    { name: 'feeRate', type: 'number', label: 'tradeBot.field.feeRate', suffix: '%', width: '1/4' },
    { name: 'slippageRate', type: 'number', label: 'tradeBot.field.slippageRate', suffix: '%', width: '1/4' },
    { name: 'sameBarExitPolicy', type: 'select', label: 'tradeBot.field.sameBarExitPolicy', options: SAME_BAR_OPTIONS, width: '1/3' },
    { name: 'auditLevel', type: 'select', label: 'tradeBot.field.auditLevel', options: AUDIT_LEVEL_OPTIONS, width: '1/3' },
    { name: 'saveFailedEntrySummary', type: 'checkbox', label: 'tradeBot.field.saveFailedEntrySummary', width: '1/3' }
  ]
};

export const REPLAY_INIT_FORM: FormConfig = {
  fields: [
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/2', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/2', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'overlayCodesText', type: 'textarea', label: 'tradeBot.field.overlayCodesJson', contentType: 'json', rows: 4, maxRows: 10, showZoomButton: true }
  ]
};

export const EVALUATE_FORM: FormConfig = {
  fields: [
    { name: 'runId', type: 'text', label: 'tradeBot.field.runId', width: '1/2', validation: [{ expression: 'required', message: 'required' }] },
    { name: 'index', type: 'number', label: 'tradeBot.field.index', suffix: 'bar', width: '1/2', validation: [{ expression: 'required', message: 'required' }] }
  ]
};
