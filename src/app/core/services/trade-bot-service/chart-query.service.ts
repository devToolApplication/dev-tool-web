import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, map } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  TradeBotChartResponse,
  TradeBotCandleResponse,
  TradeBotOverlayResponse,
  TradeSignalStreamRequest,
  TradeSignalStreamResponse
} from '../../models/trade-bot/chart-query.model';

export interface TradeRuleOverlayWsSession {
  readonly sessionId: string;
  readonly responses$: Observable<TradeSignalStreamResponse>;
  send(request: TradeSignalStreamRequest): void;
  close(): void;
}

@Injectable({ providedIn: 'root' })
export class ChartQueryService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/chart-data`;

  constructor(private readonly http: HttpClient) {}

  getCandle(symbol: string, interval: string, startTime: number, endTime: number, dataResource?: string): Observable<TradeBotCandleResponse> {
    let params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('startTime', startTime)
      .set('endTime', endTime);
    if (dataResource) {
      params = params.set('dataResource', dataResource);
    }

    return this.http
      .get<BaseResponse<TradeBotCandleResponse>>(`${this.apiUrl}/data`, { params })
      .pipe(
        map((res) => ({
          candlestickData: res.data?.candlestickData ?? []
        }))
      );
  }

  getStrategyOverlay(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
    strategyServiceName: string,
    configJson: Record<string, unknown>,
    dataResource?: string
  ): Observable<TradeBotOverlayResponse> {
    let params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('startTime', startTime)
      .set('endTime', endTime);
    if (dataResource) {
      params = params.set('dataResource', dataResource);
    }

    return this.http
      .post<BaseResponse<TradeBotOverlayResponse>>(`${this.apiUrl}/fetch/rule-overlay`, { strategyServiceName, configJson }, { params })
      .pipe(map((res) => this.normalizeOverlayResponse(res.data)));
  }

  getRuleOverlay(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
    ruleCode: string,
    configJson: Record<string, unknown>,
    dataResource?: string
  ): Observable<TradeBotOverlayResponse> {
    let params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('startTime', startTime)
      .set('endTime', endTime);
    if (dataResource) {
      params = params.set('dataResource', dataResource);
    }

    return this.http
      .post<BaseResponse<TradeBotOverlayResponse>>(`${this.apiUrl}/fetch/rule-overlay`, { ruleCode, configJson }, { params })
      .pipe(map((res) => this.normalizeOverlayResponse(res.data)));
  }

  createLiveCandleStream(dataResource: string, symbol: string, interval: string): Observable<TradeBotCandleResponse> {
    return new Observable<TradeBotCandleResponse>((subscriber) => {
      let stompClient: Client | null = null;
      let topicSubscription: StompSubscription | null = null;
      let unsubscribed = false;

      stompClient = new Client({
        brokerURL: environment.ws.tradeBotWs,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => undefined
      });

      stompClient.onConnect = () => {
        if (!stompClient || unsubscribed) {
          return;
        }

        topicSubscription = stompClient.subscribe(`/topic/market-data/${dataResource}/kline/${symbol}/${interval}`, (message: IMessage) => {
          try {
            subscriber.next(JSON.parse(message.body) as TradeBotCandleResponse);
          } catch (error) {
            subscriber.error(error);
          }
        });
      };

      stompClient.onStompError = (frame) => {
        if (unsubscribed) {
          return;
        }
        subscriber.error(new Error(frame.headers['message'] ?? 'Trade bot websocket error'));
      };

      stompClient.onWebSocketError = (event) => {
        if (unsubscribed) {
          return;
        }
        subscriber.error(event);
      };

      stompClient.activate();

      return () => {
        unsubscribed = true;
        topicSubscription?.unsubscribe();
        void stompClient?.deactivate();
      };
    });
  }

  createRuleOverlayStream(): TradeRuleOverlayWsSession {
    const sessionId = this.createWsSessionId();
    const responsesSubject = new Subject<TradeSignalStreamResponse>();
    const pendingRequests: Array<TradeSignalStreamRequest & { sessionId: string }> = [];
    let stompClient: Client | null = null;
    let topicSubscription: StompSubscription | null = null;
    let connected = false;
    let closed = false;

    const publishRequest = (request: TradeSignalStreamRequest & { sessionId: string }): void => {
      if (!stompClient || !connected) {
        pendingRequests.push(request);
        return;
      }

      stompClient.publish({
        destination: '/app/chart-data/rule-overlay',
        body: JSON.stringify(request)
      });
    };

    stompClient = new Client({
      brokerURL: environment.ws.tradeBotWs,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => undefined
    });

    stompClient.onConnect = () => {
      if (!stompClient || closed) {
        return;
      }

      connected = true;
      topicSubscription = stompClient.subscribe(`/topic/chart-data/rule-overlay/${sessionId}`, (message: IMessage) => {
        try {
          responsesSubject.next(JSON.parse(message.body) as TradeSignalStreamResponse);
        } catch (error) {
          responsesSubject.error(error);
        }
      });

      pendingRequests.splice(0).forEach((request) => publishRequest(request));
    };

    stompClient.onDisconnect = () => {
      connected = false;
    };

    stompClient.onStompError = (frame) => {
      if (closed) {
        return;
      }
      responsesSubject.error(new Error(frame.headers['message'] ?? 'Trade bot websocket error'));
    };

    stompClient.onWebSocketError = (event) => {
      if (closed) {
        return;
      }
      responsesSubject.error(event);
    };

    stompClient.activate();

    return {
      sessionId,
      responses$: responsesSubject.asObservable(),
      send: (request: TradeSignalStreamRequest) => {
        if (closed) {
          return;
        }
        publishRequest({ ...request, sessionId });
      },
      close: () => {
        if (closed) {
          return;
        }
        closed = true;
        pendingRequests.length = 0;
        topicSubscription?.unsubscribe();
        void stompClient?.deactivate();
        responsesSubject.complete();
      }
    };
  }

  private createWsSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  toChartResponse(candles: TradeBotCandleResponse, overlay?: TradeBotOverlayResponse | null): TradeBotChartResponse {
    return {
      candlestickData: candles.candlestickData ?? [],
      ...this.normalizeOverlayResponse(overlay)
    };
  }

  normalizeOverlayResponse(response?: TradeBotOverlayResponse | null): TradeBotOverlayResponse {
    return {
      lineData: response?.lineData ?? [],
      areaData: response?.areaData ?? [],
      pointData: response?.pointData ?? [],
      indicatorData: response?.indicatorData ?? []
    };
  }
}
