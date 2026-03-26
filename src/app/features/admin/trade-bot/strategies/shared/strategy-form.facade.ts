import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingResponse,
  TradeStrategyBindingUpdateDto
} from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
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
}

export interface StrategyFormPageContext {
  references: StrategyReferenceBundle;
  binding?: TradeStrategyBindingResponse;
  selectedStrategy?: StrategyResponse;
  exchangeOptions: StrategySelectOption[];
  symbolOptions: StrategySelectOption[];
  marketTypeOptions: StrategySelectOption[];
  tradeSideModeOptions: StrategySelectOption[];
  statusOptions: StrategySelectOption[];
}

@Injectable({ providedIn: 'root' })
export class StrategyFormFacade {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly bindingService: TradeStrategyBindingService
  ) {}

  loadCreateContext(strategyCode: string): Observable<StrategyFormPageContext> {
    return this.loadReferences().pipe(map((references) => this.buildContext(references, undefined, strategyCode)));
  }

  loadEditContext(id: string): Observable<StrategyFormPageContext> {
    return forkJoin({
      references: this.loadReferences(),
      binding: this.bindingService.getById(id)
    }).pipe(map(({ references, binding }) => this.buildContext(references, binding, binding.strategyCode)));
  }

  save(id: string | null, payload: TradeStrategyBindingCreateDto): Observable<TradeStrategyBindingResponse> {
    return id ? this.bindingService.update(id, payload as TradeStrategyBindingUpdateDto) : this.bindingService.create(payload);
  }

  private loadReferences(): Observable<StrategyReferenceBundle> {
    return forkJoin({
      exchanges: this.referenceDataService.getExchanges(),
      symbols: this.referenceDataService.getSymbols(),
      strategies: this.referenceDataService.getStrategies()
    });
  }

  private buildContext(
    references: StrategyReferenceBundle,
    binding: TradeStrategyBindingResponse | undefined,
    strategyCode: string
  ): StrategyFormPageContext {
    return {
      references,
      binding,
      selectedStrategy: references.strategies.find((item) => item.code === strategyCode),
      exchangeOptions: references.exchanges.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.code })),
      symbolOptions: references.symbols.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.code })),
      marketTypeOptions: [...MARKET_TYPE_OPTIONS],
      tradeSideModeOptions: [...TRADE_SIDE_MODE_OPTIONS],
      statusOptions: SYSTEM_STATUS_OPTIONS.map((item) => ({ label: String(item.label), value: String(item.value) }))
    };
  }
}
