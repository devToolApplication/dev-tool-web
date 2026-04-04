import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { StrategyRuleResponse } from '../../../../../core/models/trade-bot/strategy-rule.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingResponse,
  TradeStrategyBindingUpdateDto
} from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { MARKET_TYPE_OPTIONS, TRADE_SIDE_MODE_OPTIONS } from '../../trade-bot-admin.constants';

export interface StrategySelectOption {
  label: string;
  value: string;
}

export interface StrategyReferenceBundle {
  exchanges: ExchangeResponse[];
  symbols: SymbolResponse[];
  strategies: StrategyResponse[];
  rules: StrategyRuleResponse[];
}

export interface StrategyFormPageContext {
  references: StrategyReferenceBundle;
  binding?: TradeStrategyBindingResponse;
  selectedStrategy?: StrategyResponse;
  exchangeOptions: StrategySelectOption[];
  symbolOptions: StrategySelectOption[];
  ruleOptions: StrategySelectOption[];
  marketTypeOptions: StrategySelectOption[];
  tradeSideModeOptions: StrategySelectOption[];
  statusOptions: StrategySelectOption[];
}

@Injectable({ providedIn: 'root' })
export class StrategyFormFacade {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly strategyRuleService: StrategyRuleService,
    private readonly bindingService: TradeStrategyBindingService
  ) {}

  loadCreateContext(strategyServiceName: string): Observable<StrategyFormPageContext> {
    return this.loadReferences().pipe(map((references) => this.buildContext(references, undefined, strategyServiceName)));
  }

  loadEditContext(id: string): Observable<StrategyFormPageContext> {
    return forkJoin({
      references: this.loadReferences(),
      binding: this.bindingService.getById(id)
    }).pipe(map(({ references, binding }) => this.buildContext(references, binding, binding.strategyServiceName ?? '')));
  }

  save(id: string | null, payload: TradeStrategyBindingCreateDto): Observable<TradeStrategyBindingResponse> {
    return id ? this.bindingService.update(id, payload as TradeStrategyBindingUpdateDto) : this.bindingService.create(payload);
  }

  private loadReferences(): Observable<StrategyReferenceBundle> {
    return forkJoin({
      exchanges: this.referenceDataService.getExchanges(),
      symbols: this.referenceDataService.getSymbols(),
      strategies: this.referenceDataService.getStrategies(),
      rules: this.strategyRuleService.getAll()
    });
  }

  private buildContext(
    references: StrategyReferenceBundle,
    binding: TradeStrategyBindingResponse | undefined,
    strategyServiceName: string
  ): StrategyFormPageContext {
    return {
      references,
      binding,
      selectedStrategy: references.strategies.find((item) => item.serviceName === strategyServiceName),
      exchangeOptions: references.exchanges.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id })),
      symbolOptions: references.symbols.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.id })),
      ruleOptions: references.rules
        .filter((item) => item.strategyServiceName === strategyServiceName)
        .map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id })),
      marketTypeOptions: [...MARKET_TYPE_OPTIONS],
      tradeSideModeOptions: [...TRADE_SIDE_MODE_OPTIONS],
      statusOptions: SYSTEM_STATUS_OPTIONS.map((item) => ({ label: String(item.label), value: String(item.value) }))
    };
  }
}
