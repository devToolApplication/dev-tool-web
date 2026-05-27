import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormConfig, FormContext } from '../../../../../../../shared/ui/form-input/models/form-config.model';
import { PaperTradeAccount } from '../../../../data-access/models/paper-trade.model';
import { FEED_CODE_OPTIONS, MARKET_SOURCE_OPTIONS, MARKET_TYPE_OPTIONS, SYMBOL_OPTIONS, TIMEFRAME_OPTIONS } from '../../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-paper-trade-create-dialogs',
  standalone: false,
  templateUrl: './paper-trade-create-dialogs.component.html'
})
export class PaperTradeCreateDialogsComponent {
  @Input() accounts: PaperTradeAccount[] = [];
  @Input() strategyOptions: Array<{ label: string; value: string }> = [];
  @Input() actionLoading = false;
  @Input() createAccountVisible = false;
  @Input() startSessionVisible = false;
  @Output() createAccountVisibleChange = new EventEmitter<boolean>();
  @Output() startSessionVisibleChange = new EventEmitter<boolean>();
  @Output() createAccount = new EventEmitter<Record<string, unknown>>();
  @Output() startSession = new EventEmitter<Record<string, unknown>>();

  readonly formContext: FormContext = { user: null, mode: 'create' };

  readonly accountForm: FormConfig = {
    fields: [
      { name: 'name', label: 'tradeBot.paper.accountName', type: 'text', width: '1/3' },
      { name: 'baseCurrency', label: 'tradeBot.paper.baseCurrency', type: 'select', options: [{ label: 'USDT', value: 'USDT' }, { label: 'USDC', value: 'USDC' }, { label: 'USD', value: 'USD' }], width: '1/6' },
      { name: 'initialBalance', label: 'tradeBot.field.initialBalance', type: 'number', suffix: ' USDT', width: '1/4' },
      { name: 'description', label: 'tradeBot.field.description', type: 'text', width: '1/4' }
    ]
  };
  readonly accountInitialValue = {
    name: 'BTCUSDT Paper Account',
    baseCurrency: 'USDT',
    initialBalance: 10000,
    description: 'Ready account for Binance USD-M BTCUSDT paper trade'
  };

  readonly startForm = computed<FormConfig>(() => ({
    fields: [
      {
        name: 'accountId',
        label: 'tradeBot.paper.account',
        type: 'select',
        width: '1/3',
        options: this.accounts.map((account) => ({ label: `${account.name} (${account.baseCurrency})`, value: account.id }))
      },
      { name: 'strategyCode', label: 'tradeBot.field.strategyCode', type: 'auto-complete', options: this.strategyOptions, width: '1/3' },
      { name: 'symbol', label: 'tradeBot.field.symbol', type: 'auto-complete', options: SYMBOL_OPTIONS, width: '1/6' },
      { name: 'interval', label: 'tradeBot.field.timeframe', type: 'select', options: TIMEFRAME_OPTIONS, width: '1/6' },
      { name: 'source', label: 'tradeBot.field.source', type: 'select', options: MARKET_SOURCE_OPTIONS, width: '1/4' },
      { name: 'marketType', label: 'tradeBot.field.marketType', type: 'select', options: MARKET_TYPE_OPTIONS, width: '1/4' },
      { name: 'feedCode', label: 'tradeBot.field.feedCode', type: 'auto-complete', options: FEED_CODE_OPTIONS, width: '1/4' },
      { name: 'riskPerTradePct', label: 'tradeBot.field.riskPerTradePct', type: 'number', suffix: '%', width: '1/4' },
      { name: 'feeRate', label: 'tradeBot.field.feeRate', type: 'number', suffix: '%', width: '1/4' },
      { name: 'slippageRate', label: 'tradeBot.field.slippageRate', type: 'number', suffix: '%', width: '1/4' },
      { name: 'maxPositionValuePct', label: 'tradeBot.paper.maxPositionValuePct', type: 'number', suffix: '%', width: '1/4' }
    ]
  }));

  readonly startInitialValue = computed(() => ({
    accountId: this.accounts[0]?.id ?? '',
    strategyCode: 'BTCUSDT_PAPER_DEMO',
    symbol: 'BTCUSDT',
    interval: '1m',
    source: 'BINANCE_USDM',
    marketType: 'USD_M_FUTURES',
    feedCode: 'BINANCE_USDM_BTCUSDT_1M',
    riskPerTradePct: 1,
    feeRate: 0.04,
    slippageRate: 0.01,
    maxPositionValuePct: 20
  }));
}
