import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseResponse } from '../../../../../core/models/base-response.model';
import { environment } from '../../../../../../enviroment/environment';
import {
  CreatePaperTradeAccountRequest,
  PaperTradeAccount,
  PaperTradeControl,
  PaperTradeEquityPoint,
  PaperTradeEvent,
  PaperTradeFill,
  PaperTradeOrder,
  PaperTradePosition,
  PaperTradeSession,
  PaperTradeSessionDetail,
  PaperTradeSessionStatus,
  PaperTradeSnapshot,
  PaperTradeSummary,
  StartPaperTradeSessionRequest,
  UpdatePaperTradeAccountRequest
} from '../models/paper-trade.model';

@Injectable({ providedIn: 'root' })
export class PaperTradeApiService {
  private readonly baseUrl = `${environment.apiUrl.tradeBotAdminUrl}/paper-trade`;

  constructor(private readonly http: HttpClient) {}

  getAccounts(): Observable<PaperTradeAccount[]> {
    return this.http.get<BaseResponse<PaperTradeAccount[]>>(`${this.baseUrl}/accounts`).pipe(map((response) => response.data ?? []));
  }

  createAccount(payload: CreatePaperTradeAccountRequest): Observable<PaperTradeAccount> {
    return this.http.post<BaseResponse<PaperTradeAccount>>(`${this.baseUrl}/accounts`, payload).pipe(map((response) => response.data));
  }

  updateAccount(accountId: string, payload: UpdatePaperTradeAccountRequest): Observable<PaperTradeAccount> {
    return this.http.put<BaseResponse<PaperTradeAccount>>(`${this.baseUrl}/accounts/${accountId}`, payload).pipe(map((response) => response.data));
  }

  resetAccount(accountId: string): Observable<PaperTradeAccount> {
    return this.http.patch<BaseResponse<PaperTradeAccount>>(`${this.baseUrl}/accounts/${accountId}/reset`, {}).pipe(map((response) => response.data));
  }

  getSessions(filters: { accountId?: string; status?: PaperTradeSessionStatus; limit?: number } = {}): Observable<PaperTradeSession[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<PaperTradeSession[]>>(`${this.baseUrl}/sessions`, { params }).pipe(map((response) => response.data ?? []));
  }

  startSession(payload: StartPaperTradeSessionRequest): Observable<PaperTradeSessionDetail> {
    return this.http.post<BaseResponse<PaperTradeSessionDetail>>(`${this.baseUrl}/sessions/start`, payload).pipe(map((response) => response.data));
  }

  getSessionDetail(sessionId: string): Observable<PaperTradeSessionDetail> {
    return this.http.get<BaseResponse<PaperTradeSessionDetail>>(`${this.baseUrl}/sessions/${sessionId}`).pipe(map((response) => response.data));
  }

  evaluateLatest(sessionId: string): Observable<PaperTradeSessionDetail> {
    return this.http.post<BaseResponse<PaperTradeSessionDetail>>(`${this.baseUrl}/sessions/${sessionId}/evaluate-latest`, {}).pipe(map((response) => response.data));
  }

  pause(sessionId: string): Observable<PaperTradeControl> {
    return this.http.post<BaseResponse<PaperTradeControl>>(`${this.baseUrl}/sessions/${sessionId}/pause`, {}).pipe(map((response) => response.data));
  }

  resume(sessionId: string): Observable<PaperTradeControl> {
    return this.http.post<BaseResponse<PaperTradeControl>>(`${this.baseUrl}/sessions/${sessionId}/resume`, {}).pipe(map((response) => response.data));
  }

  stop(sessionId: string): Observable<PaperTradeControl> {
    return this.http.post<BaseResponse<PaperTradeControl>>(`${this.baseUrl}/sessions/${sessionId}/stop`, {}).pipe(map((response) => response.data));
  }

  getOrders(sessionId: string): Observable<PaperTradeOrder[]> {
    return this.http.get<BaseResponse<PaperTradeOrder[]>>(`${this.baseUrl}/sessions/${sessionId}/orders`).pipe(map((response) => response.data ?? []));
  }

  getFills(sessionId: string): Observable<PaperTradeFill[]> {
    return this.http.get<BaseResponse<PaperTradeFill[]>>(`${this.baseUrl}/sessions/${sessionId}/fills`).pipe(map((response) => response.data ?? []));
  }

  getPositions(sessionId: string): Observable<PaperTradePosition[]> {
    return this.http.get<BaseResponse<PaperTradePosition[]>>(`${this.baseUrl}/sessions/${sessionId}/positions`).pipe(map((response) => response.data ?? []));
  }

  getEquityCurve(sessionId: string): Observable<PaperTradeEquityPoint[]> {
    return this.http.get<BaseResponse<PaperTradeEquityPoint[]>>(`${this.baseUrl}/sessions/${sessionId}/equity-curve`).pipe(map((response) => response.data ?? []));
  }

  getEvents(sessionId: string): Observable<PaperTradeEvent[]> {
    return this.http.get<BaseResponse<PaperTradeEvent[]>>(`${this.baseUrl}/sessions/${sessionId}/events`).pipe(map((response) => response.data ?? []));
  }

  getSnapshot(sessionId: string): Observable<PaperTradeSnapshot> {
    return this.http.get<BaseResponse<PaperTradeSnapshot>>(`${this.baseUrl}/sessions/${sessionId}/snapshot`).pipe(map((response) => response.data));
  }

  getSummary(sessionId: string): Observable<PaperTradeSummary> {
    return this.http.get<BaseResponse<PaperTradeSummary>>(`${this.baseUrl}/sessions/${sessionId}/summary`).pipe(map((response) => response.data));
  }
}
