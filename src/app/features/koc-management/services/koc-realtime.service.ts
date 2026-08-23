import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';

export type KocRealtimeEventType =
  | 'campaign.counters'
  | 'candidate.status'
  | 'workflow.progress'
  | 'incident.status'
  | 'dependency.recovery';

export interface KocRealtimeEvent {
  readonly type: KocRealtimeEventType;
  readonly aggregateId: string;
  readonly version?: number;
  readonly payload?: unknown;
}

export interface KocRealtimeConnectOptions {
  readonly streamUrl?: string;
  readonly reconnect?: boolean;
  readonly reconnectIntervalMs?: number;
  readonly socketFactory?: (url: string) => WebSocket;
}

const VALID_EVENT_TYPES = new Set<string>([
  'campaign.counters',
  'candidate.status',
  'workflow.progress',
  'incident.status',
  'dependency.recovery',
]);

@Injectable({ providedIn: 'root' })
export class KocRealtimeService {
  connect(options?: KocRealtimeConnectOptions): Observable<KocRealtimeEvent> {
    const streamUrl = options?.streamUrl?.trim();
    if (!streamUrl) {
      return EMPTY;
    }

    const reconnect = options?.reconnect ?? false;
    const reconnectIntervalMs = Math.max(250, options?.reconnectIntervalMs ?? 2_000);
    const createSocket = options?.socketFactory ?? ((url: string) => new WebSocket(url));

    return new Observable<KocRealtimeEvent>((subscriber) => {
      let socket: WebSocket | null = null;
      let reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
      let isUnsubscribed = false;

      const scheduleReconnect = () => {
        if (!reconnect || isUnsubscribed || reconnectTimerId !== null) {
          return;
        }
        reconnectTimerId = setTimeout(() => {
          reconnectTimerId = null;
          openSocket();
        }, reconnectIntervalMs);
      };

      const openSocket = () => {
        if (isUnsubscribed) {
          return;
        }
        try {
          socket = createSocket(streamUrl);
        } catch (error) {
          console.warn('Unable to create WebSocket connection', error);
          scheduleReconnect();
          return;
        }

        socket.onmessage = (event: MessageEvent) => {
          const parsed = this.parseMessage(event.data);
          if (parsed && !subscriber.closed) {
            subscriber.next(parsed);
          }
        };

        socket.onerror = (error) => {
          console.warn('KOC realtime WebSocket error', error);
        };

        socket.onclose = () => {
          socket = null;
          scheduleReconnect();
        };
      };

      openSocket();

      return () => {
        isUnsubscribed = true;
        if (reconnectTimerId !== null) {
          clearTimeout(reconnectTimerId);
          reconnectTimerId = null;
        }
        if (socket) {
          socket.onclose = null;
          socket.onerror = null;
          socket.onmessage = null;
          socket.close();
          socket = null;
        }
      };
    });
  }

  isStaleEvent(event: KocRealtimeEvent, currentVersion?: number): boolean {
    // ponytail: scalar version comparison; upgrade to composite generation clocks if multi-master stream is introduced
    if (currentVersion == null || event.version == null) {
      return false;
    }
    return event.version <= currentVersion;
  }

  parseMessage(raw: unknown): KocRealtimeEvent | null {
    try {
      const text = typeof raw === 'string' ? raw : String(raw);
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof parsed['type'] === 'string' &&
        VALID_EVENT_TYPES.has(parsed['type']) &&
        typeof parsed['aggregateId'] === 'string' &&
        parsed['aggregateId'].length > 0
      ) {
        return {
          type: parsed['type'] as KocRealtimeEventType,
          aggregateId: parsed['aggregateId'],
          ...(typeof parsed['version'] === 'number' ? { version: parsed['version'] } : {}),
          ...(parsed['payload'] !== undefined ? { payload: parsed['payload'] } : {}),
        };
      }
      console.warn('Dropped invalid KOC realtime event payload:', raw);
      return null;
    } catch (error) {
      console.warn('Failed to parse KOC realtime message:', error);
      return null;
    }
  }
}