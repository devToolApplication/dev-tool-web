import { computed, Injectable, signal } from '@angular/core';
import { TaskProgressState } from '../../../../core/models/realtime/realtime.model';
import { CandleBarResponse } from '../../../../core/models/trade-bot/market-data.model';
import {
  PaperTradeAccount,
  PaperTradeEquityPoint,
  PaperTradeEvent,
  PaperTradeFill,
  PaperTradeOrder,
  PaperTradePosition,
  PaperTradeSession,
  PaperTradeSessionDetail
} from '../data-access/models/paper-trade.model';

@Injectable({ providedIn: 'root' })
export class PaperTradeStoreService {
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly activeTab = signal('overview');
  readonly error = signal<string | null>(null);
  readonly accounts = signal<PaperTradeAccount[]>([]);
  readonly sessions = signal<PaperTradeSession[]>([]);
  readonly detail = signal<PaperTradeSessionDetail | null>(null);
  readonly orders = signal<PaperTradeOrder[]>([]);
  readonly fills = signal<PaperTradeFill[]>([]);
  readonly positions = signal<PaperTradePosition[]>([]);
  readonly equityCurve = signal<PaperTradeEquityPoint[]>([]);
  readonly events = signal<PaperTradeEvent[]>([]);
  readonly candles = signal<CandleBarResponse[]>([]);
  readonly progress = signal<TaskProgressState | null>(null);

  readonly selectedSession = computed(() => this.detail()?.session ?? null);
  readonly selectedAccount = computed(() => this.detail()?.account ?? this.accounts()[0] ?? null);
  readonly hasActiveSession = computed(() => this.sessions().some((session) => session.status === 'RUNNING'));

  setDetail(detail: PaperTradeSessionDetail): void {
    this.detail.set(detail);
    this.error.set(null);
  }

  clearSessionData(): void {
    this.detail.set(null);
    this.orders.set([]);
    this.fills.set([]);
    this.positions.set([]);
    this.equityCurve.set([]);
    this.events.set([]);
    this.candles.set([]);
    this.progress.set(null);
  }
}
