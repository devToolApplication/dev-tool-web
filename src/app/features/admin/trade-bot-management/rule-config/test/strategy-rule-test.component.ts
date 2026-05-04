import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ExchangeResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { TradeBotCandleResponse } from '../../../../../core/models/trade-bot/chart-query.model';
import { StrategyRuleResponse } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { ChartQueryService } from '../../../../../core/services/trade-bot-service/chart-query.service';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { STRATEGY_RULE_ROUTES } from '../strategy-rule.constants';

type RuleTestFormGroup = FormGroup<{
  exchangeId: FormControl<string>;
  symbolId: FormControl<string>;
  fromDate: FormControl<Date | null>;
  toDate: FormControl<Date | null>;
}>;

@Component({
  selector: 'app-strategy-rule-test',
  standalone: false,
  templateUrl: './strategy-rule-test.component.html'
})
export class StrategyRuleTestComponent implements OnInit {
  readonly form: RuleTestFormGroup = new FormGroup({
    exchangeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    symbolId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fromDate: new FormControl(this.toDateOffset(-14), { validators: [Validators.required] }),
    toDate: new FormControl(this.toDateOffset(0), { validators: [Validators.required] })
  });

  rule: StrategyRuleResponse | null = null;
  exchanges: ExchangeResponse[] = [];
  symbols: SymbolResponse[] = [];
  exchangeOptions: Array<{ label: string; value: string }> = [];
  symbolOptions: Array<{ label: string; value: string }> = [];
  chartResponse: TradeBotCandleResponse | null = null;
  loading = false;
  previewing = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ruleService: StrategyRuleService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly chartQueryService: ChartQueryService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate([STRATEGY_RULE_ROUTES.list]);
      return;
    }

    this.loading = true;
    this.loadingService
      .track(
        forkJoin({
          rule: this.ruleService.getById(id),
          exchanges: this.referenceDataService.getExchanges(),
          symbols: this.referenceDataService.getSymbols()
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ rule, exchanges, symbols }) => {
          this.rule = rule;
          this.exchanges = exchanges;
          this.symbols = symbols;
          this.exchangeOptions = exchanges.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));
          this.symbolOptions = symbols.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.id }));
          this.form.patchValue({
            exchangeId: exchanges[0]?.id ?? '',
            symbolId: symbols[0]?.id ?? ''
          });
          this.runPreview();
        },
        error: () => {
          this.toastService.error('tradeBot.strategyRule.toast.loadTestContextFailed');
          void this.router.navigate([STRATEGY_RULE_ROUTES.list]);
        }
      });
  }

  goBack(): void {
    if (!this.rule?.id) {
      void this.router.navigate([STRATEGY_RULE_ROUTES.list]);
      return;
    }
    void this.router.navigate([STRATEGY_RULE_ROUTES.edit(this.rule.id)]);
  }

  runPreview(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.rule) {
      return;
    }

    const value = this.form.getRawValue();
    const exchange = this.exchanges.find((item) => item.id === value.exchangeId);
    const symbol = this.symbols.find((item) => item.id === value.symbolId);
    const fromDate = value.fromDate;
    const toDate = value.toDate;
    if (!exchange || !symbol || !fromDate || !toDate) {
      return;
    }

    const dataResource = this.resolveDataResource(exchange.code);
    const interval = this.resolvePreviewInterval(this.rule.configJson, dataResource);
    const startTime = new Date(fromDate).getTime();
    const endTime = new Date(toDate).setHours(23, 59, 59, 999);
    this.previewing = true;
    this.loadingService
      .track(
        this.chartQueryService.getRulePreview(
          symbol.providerSymbol ?? symbol.code,
          interval,
          startTime,
          endTime,
          this.rule.code,
          this.rule.configJson,
          dataResource
        )
      )
      .pipe(finalize(() => (this.previewing = false)))
      .subscribe({
        next: (response) => (this.chartResponse = response),
        error: (error) => this.toastService.error(error?.error?.errorMessage ?? 'tradeBot.strategyRule.toast.previewFailed')
      });
  }

  private resolvePreviewInterval(configJson: Record<string, unknown>, dataResource: string): string {
    const timeframe = String(configJson['trigger_timeframe'] ?? configJson['base_timeframe'] ?? 'M15').trim().toUpperCase();
    if (dataResource === 'BINANCE') {
      switch (timeframe) {
        case 'M1':
          return '1m';
        case 'M5':
          return '5m';
        case 'M15':
          return '15m';
        case 'M30':
          return '30m';
        case 'H1':
          return '1h';
        case 'H4':
          return '4h';
        case 'D1':
          return '1d';
        default:
          return timeframe.toLowerCase();
      }
    }
    switch (timeframe) {
      case 'M1':
        return 'm1';
      case 'M5':
        return 'm5';
      case 'M15':
        return 'm15';
      case 'M30':
        return 'm30';
      case 'H1':
        return 'h1';
      case 'H4':
        return 'h4';
      case 'D1':
        return 'd1';
      default:
        return timeframe.toLowerCase();
    }
  }

  private resolveDataResource(exchangeCode: string): string {
    return exchangeCode.toUpperCase().includes('OANDA') ? 'OANDA' : 'BINANCE';
  }

  private toDateOffset(offsetDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date;
  }
}
