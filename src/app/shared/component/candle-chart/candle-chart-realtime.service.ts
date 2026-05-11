import { Injectable } from '@angular/core';

import type {
  CandleChartErrorEvent,
  CandleChartRealtimeMessage,
  ChartCandle,
  ChartOverlay,
  RealtimeConfig,
} from './candle-chart.models';

export interface CandleChartRealtimeCallbacks {
  candle: (candle: ChartCandle) => void;
  overlay: (overlays: ChartOverlay[]) => void;
  reset: (candles: ChartCandle[], overlays: ChartOverlay[]) => void;
  error: (event: CandleChartErrorEvent) => void;
  status: (status: 'LOADING' | 'READY' | 'ERROR') => void;
}

@Injectable()
export class CandleChartRealtimeService {
  private socket: WebSocket | null = null;
  private reconnectTimerId: number | null = null;
  private closedByClient = false;
  private config: RealtimeConfig | null = null;
  private callbacks: CandleChartRealtimeCallbacks | null = null;

  connect(config: RealtimeConfig | null | undefined, callbacks: CandleChartRealtimeCallbacks): void {
    this.disconnect();
    this.config = config ?? null;
    this.callbacks = callbacks;
    if (!config?.enabled || !config.streamUrl) {
      return;
    }

    this.closedByClient = false;
    this.openSocket(config.streamUrl);
  }

  disconnect(): void {
    this.closedByClient = true;
    if (this.reconnectTimerId != null) {
      window.clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  parseMessage(raw: string): CandleChartRealtimeMessage {
    const parsed = JSON.parse(raw) as Partial<CandleChartRealtimeMessage>;
    const type = parsed.type;
    if (type !== 'CANDLE' && type !== 'OVERLAY' && type !== 'RESET' && type !== 'ERROR') {
      throw new Error('Unsupported realtime message type');
    }

    if (type === 'CANDLE') {
      const candle = this.extractCandle(parsed);
      if (!candle) {
        throw new Error('Realtime candle payload is invalid');
      }
      return { type, candle };
    }

    if (type === 'OVERLAY') {
      return { type, overlays: this.extractOverlays(parsed) };
    }

    if (type === 'RESET') {
      return {
        type,
        candles: this.extractCandles(parsed),
        overlays: this.extractOverlays(parsed),
      };
    }

    return { type, message: String(parsed.message ?? 'Realtime stream error'), data: parsed.data };
  }

  private openSocket(url: string): void {
    this.callbacks?.status('LOADING');
    try {
      this.socket = new WebSocket(url);
    } catch (error) {
      this.emitError('Unable to open realtime socket', error);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = (): void => this.callbacks?.status('READY');
    this.socket.onmessage = (event): void => this.handleMessage(String(event.data));
    this.socket.onerror = (event): void => this.emitError('Realtime socket error', event);
    this.socket.onclose = (): void => {
      this.socket = null;
      if (!this.closedByClient) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(raw: string): void {
    try {
      const message = this.parseMessage(raw);
      if (message.type === 'CANDLE' && message.candle) {
        this.callbacks?.candle(message.candle);
      } else if (message.type === 'OVERLAY') {
        this.callbacks?.overlay(message.overlays ?? []);
      } else if (message.type === 'RESET') {
        this.callbacks?.reset(message.candles ?? [], message.overlays ?? []);
      } else if (message.type === 'ERROR') {
        this.emitError(message.message ?? 'Realtime stream error', message.data);
      }
    } catch (error) {
      this.emitError('Invalid realtime message', error);
    }
  }

  private scheduleReconnect(): void {
    const config = this.config;
    if (!config?.reconnect || !config.streamUrl || this.closedByClient) {
      return;
    }

    this.reconnectTimerId = window.setTimeout(
      () => this.openSocket(config.streamUrl!),
      Math.max(250, Number(config.reconnectIntervalMs ?? 2_000)),
    );
  }

  private emitError(message: string, detail?: unknown): void {
    this.callbacks?.status('ERROR');
    this.callbacks?.error({ message, detail });
  }

  private extractCandles(parsed: Partial<CandleChartRealtimeMessage>): ChartCandle[] {
    const rawCandles = Array.isArray(parsed.candles)
      ? parsed.candles
      : this.isRecord(parsed.data) && Array.isArray(parsed.data['candles'])
        ? parsed.data['candles']
        : [];
    return rawCandles.flatMap((item) => {
      const candle = this.asCandle(item);
      return candle ? [candle] : [];
    });
  }

  private extractCandle(parsed: Partial<CandleChartRealtimeMessage>): ChartCandle | null {
    return this.asCandle(parsed.candle ?? parsed.data);
  }

  private extractOverlays(parsed: Partial<CandleChartRealtimeMessage>): ChartOverlay[] {
    if (Array.isArray(parsed.overlays)) {
      return parsed.overlays;
    }
    if (parsed.overlay) {
      return [parsed.overlay];
    }
    if (this.isRecord(parsed.data)) {
      if (Array.isArray(parsed.data['overlays'])) {
        return parsed.data['overlays'] as ChartOverlay[];
      }
      if (this.isRecord(parsed.data['overlay'])) {
        return [parsed.data['overlay'] as unknown as ChartOverlay];
      }
    }
    return [];
  }

  private asCandle(value: unknown): ChartCandle | null {
    if (!this.isRecord(value)) {
      return null;
    }

    const time = value['time'] ?? value['openTime'] ?? value['open_time'];
    const open = Number(value['open']);
    const high = Number(value['high']);
    const low = Number(value['low']);
    const close = Number(value['close']);
    if (time == null || [open, high, low, close].some((item) => Number.isNaN(item))) {
      return null;
    }

    return {
      time: time as ChartCandle['time'],
      open,
      high,
      low,
      close,
      volume: value['volume'] == null ? undefined : Number(value['volume']),
      closed: value['closed'] == null ? undefined : Boolean(value['closed']),
      openTime: (value['openTime'] ?? value['open_time']) as ChartCandle['openTime'],
      closeTime: (value['closeTime'] ?? value['close_time']) as ChartCandle['closeTime'],
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
