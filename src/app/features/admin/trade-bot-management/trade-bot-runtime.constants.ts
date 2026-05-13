import { FormConfig } from '../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../shared/ui/form-input/utils/validation-rules';

function requiredRule() {
  return Rules.required('required');
}

export const TRADE_BOT_ROUTES = {
  dashboard: '/admin/trade-bot/dashboard',
  marketData: '/admin/trade-bot/market-data',
  cacheMonitor: '/admin/trade-bot/cache-monitor',
  systemLogs: '/admin/trade-bot/system-logs',
  configHistory: '/admin/trade-bot/config-history',
  indicators: '/admin/trade-bot/indicator-configs',
  rules: '/admin/trade-bot/rule-configs',
  strategies: '/admin/trade-bot/strategy-configs',
  backtests: '/admin/trade-bot/backtests',
  sandbox: '/admin/trade-bot/sandbox',
  replay: '/admin/trade-bot/replay',
  paperTrade: '/admin/trade-bot/paper-trade'
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
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/4', validation: [requiredRule()] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/4', validation: [requiredRule()] },
    { name: 'source', type: 'text', label: 'tradeBot.field.source', width: '1/4' },
    { name: 'marketType', type: 'text', label: 'tradeBot.field.marketType', width: '1/4' },
    { name: 'feedCode', type: 'text', label: 'tradeBot.field.feedCode', width: '1/4' },
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
      validation: [requiredRule()]
    }
  ]
};

export const BINANCE_USDM_SYNC_FORM: FormConfig = {
  fields: [
    { name: 'symbolsText', type: 'text', label: 'tradeBot.field.symbols', width: '1/3', validation: [requiredRule()] },
    { name: 'timeframesText', type: 'text', label: 'tradeBot.field.timeframes', width: '1/3', validation: [requiredRule()] },
    { name: 'mode', type: 'select', label: 'tradeBot.field.mode', width: '1/3', options: [
      { label: 'tradeBot.sync.mode.latest', value: 'latest' },
      { label: 'tradeBot.sync.mode.range', value: 'range' },
      { label: 'tradeBot.sync.mode.backfill', value: 'backfill' },
      { label: 'tradeBot.sync.mode.repairGap', value: 'repair-gap' }
    ] },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/3' },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/3' },
    { name: 'initialLookbackHours', type: 'number', label: 'tradeBot.field.initialLookbackHours', suffix: 'hours', width: '1/3' },
    { name: 'limit', type: 'number', label: 'tradeBot.field.limit', suffix: 'bars', width: '1/3' },
    { name: 'maxPages', type: 'number', label: 'tradeBot.field.maxPages', suffix: 'pages', width: '1/3' },
    { name: 'lookbackBars', type: 'number', label: 'tradeBot.field.lookbackBars', suffix: 'bars', width: '1/3' },
    { name: 'onlyClosedCandle', type: 'checkbox', label: 'tradeBot.field.onlyClosedCandle', width: '1/3' }
  ]
};

export const INDICATOR_FORM: FormConfig = {
  fields: [
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [requiredRule()] },
    { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/3', validation: [requiredRule()] },
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
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [requiredRule()] },
    { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/3', validation: [requiredRule()] },
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
    { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [requiredRule()] },
    { name: 'type', type: 'select', label: 'tradeBot.field.type', options: [{ label: 'ENTRY_TP_SL', value: 'ENTRY_TP_SL' }], width: '1/3' },
    { name: 'strategyVersion', type: 'text', label: 'tradeBot.field.strategyVersion', width: '1/3' },
    { name: 'entryRule', type: 'text', label: 'tradeBot.field.entryRule', width: '1/3', validation: [requiredRule()] },
    { name: 'slRule', type: 'text', label: 'tradeBot.field.slRule', width: '1/3', validation: [requiredRule()] },
    { name: 'tpRule', type: 'text', label: 'tradeBot.field.tpRule', width: '1/3', validation: [requiredRule()] },
    { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
    { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true }
  ]
};

export const BACKTEST_RUN_FORM: FormConfig = {
  fields: [
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [requiredRule()] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [requiredRule()] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [requiredRule()] },
    { name: 'source', type: 'text', label: 'tradeBot.field.source', width: '1/3' },
    { name: 'marketType', type: 'text', label: 'tradeBot.field.marketType', width: '1/3' },
    { name: 'feedCode', type: 'text', label: 'tradeBot.field.feedCode', width: '1/3' },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/2', validation: [requiredRule()] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/2', validation: [requiredRule()] },
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
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [requiredRule()] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [requiredRule()] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [requiredRule()] },
    { name: 'source', type: 'text', label: 'tradeBot.field.source', width: '1/3' },
    { name: 'marketType', type: 'text', label: 'tradeBot.field.marketType', width: '1/3' },
    { name: 'feedCode', type: 'text', label: 'tradeBot.field.feedCode', width: '1/3' },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/2', validation: [requiredRule()] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/2', validation: [requiredRule()] },
    { name: 'overlayCodesText', type: 'textarea', label: 'tradeBot.field.overlayCodesJson', contentType: 'json', rows: 4, maxRows: 10, showZoomButton: true }
  ]
};

export const EVALUATE_FORM: FormConfig = {
  fields: [
    { name: 'runId', type: 'text', label: 'tradeBot.field.runId', width: '1/2', validation: [requiredRule()] },
    { name: 'index', type: 'number', label: 'tradeBot.field.index', suffix: 'bar', width: '1/2', validation: [requiredRule()] }
  ]
};

export const SANDBOX_FORM: FormConfig = {
  fields: [
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [requiredRule()] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [requiredRule()] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [requiredRule()] },
    { name: 'source', type: 'text', label: 'tradeBot.field.source', width: '1/3' },
    { name: 'marketType', type: 'text', label: 'tradeBot.field.marketType', width: '1/3' },
    { name: 'feedCode', type: 'text', label: 'tradeBot.field.feedCode', width: '1/3' },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/3', validation: [requiredRule()] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/3', validation: [requiredRule()] },
    { name: 'startIndex', type: 'number', label: 'tradeBot.field.startIndex', suffix: 'bar', width: '1/4' },
    { name: 'endIndex', type: 'number', label: 'tradeBot.field.endIndex', suffix: 'bar', width: '1/4' },
    { name: 'warmupBars', type: 'number', label: 'tradeBot.field.warmupBars', suffix: 'bars', width: '1/4' },
    { name: 'initialCapital', type: 'number', label: 'tradeBot.field.initialCapital', prefix: '$', width: '1/4' },
    { name: 'riskPerTradePct', type: 'number', label: 'tradeBot.field.riskPerTradePct', suffix: '%', width: '1/3' },
    { name: 'feeRate', type: 'number', label: 'tradeBot.field.feeRate', suffix: '%', width: '1/3' },
    { name: 'slippageRate', type: 'number', label: 'tradeBot.field.slippageRate', suffix: '%', width: '1/3' },
    { name: 'paramsText', type: 'textarea', label: 'tradeBot.field.paramsJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true }
  ]
};

export const EVALUATE_BAR_FORM: FormConfig = {
  fields: [
    { name: 'strategyCode', type: 'text', label: 'tradeBot.field.strategyCode', width: '1/3', validation: [requiredRule()] },
    { name: 'symbol', type: 'text', label: 'tradeBot.field.symbol', width: '1/3', validation: [requiredRule()] },
    { name: 'timeframe', type: 'text', label: 'tradeBot.field.timeframe', width: '1/3', validation: [requiredRule()] },
    { name: 'source', type: 'text', label: 'tradeBot.field.source', width: '1/3' },
    { name: 'marketType', type: 'text', label: 'tradeBot.field.marketType', width: '1/3' },
    { name: 'feedCode', type: 'text', label: 'tradeBot.field.feedCode', width: '1/3' },
    { name: 'fromTime', type: 'text', label: 'tradeBot.field.fromTime', width: '1/3', validation: [requiredRule()] },
    { name: 'toTime', type: 'text', label: 'tradeBot.field.toTime', width: '1/3', validation: [requiredRule()] },
    { name: 'index', type: 'number', label: 'tradeBot.field.index', suffix: 'bar', width: '1/3', validation: [requiredRule()] },
    { name: 'paramsText', type: 'textarea', label: 'tradeBot.field.paramsJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true }
  ]
};
