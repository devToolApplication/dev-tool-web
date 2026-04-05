import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import { TradeBotCandleResponse } from '../../models/trade-bot/chart-query.model';

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
          candlestickData: res.data?.candlestickData ?? [],
          lineData: res.data?.lineData ?? [],
          areaData: res.data?.areaData ?? [],
          pointData: res.data?.pointData ?? [],
          indicatorData: res.data?.indicatorData ?? []
        }))
      );
  }

  getStrategyPreview(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
    strategyServiceName: string,
    configJson: Record<string, unknown>,
    dataResource?: string
  ): Observable<TradeBotCandleResponse> {
    let params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('startTime', startTime)
      .set('endTime', endTime);
    if (dataResource) {
      params = params.set('dataResource', dataResource);
    }

    return this.http
      .post<BaseResponse<TradeBotCandleResponse>>(`${this.apiUrl}/fetch/trade-signal`, { strategyServiceName, configJson }, { params })
      .pipe(
        map((res) => ({
          candlestickData: res.data?.candlestickData ?? [],
          lineData: res.data?.lineData ?? [],
          areaData: res.data?.areaData ?? [],
          pointData: res.data?.pointData ?? [],
          indicatorData: res.data?.indicatorData ?? []
        }))
      );
  }

  getRulePreview(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number,
    ruleCode: string,
    configJson: Record<string, unknown>,
    dataResource?: string
  ): Observable<TradeBotCandleResponse> {
    let params = new HttpParams()
      .set('symbol', symbol)
      .set('interval', interval)
      .set('startTime', startTime)
      .set('endTime', endTime);
    if (dataResource) {
      params = params.set('dataResource', dataResource);
    }

    return this.http
      .post<BaseResponse<TradeBotCandleResponse>>(`${this.apiUrl}/fetch/trade-signal`, { ruleCode, configJson }, { params })
      .pipe(
        map((res) => ({
          candlestickData: res.data?.candlestickData ?? [],
          lineData: res.data?.lineData ?? [],
          areaData: res.data?.areaData ?? [],
          pointData: res.data?.pointData ?? [],
          indicatorData: res.data?.indicatorData ?? []
        }))
      );
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
}
