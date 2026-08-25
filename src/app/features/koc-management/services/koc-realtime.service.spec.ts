import { vi } from 'vitest';
import type { KocRealtimeEvent } from './koc-realtime.service';
import { KocRealtimeService } from './koc-realtime.service';

class MockWebSocket {
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
  }

  close(): void {
    this.closed = true;
  }

  triggerMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  triggerClose(): void {
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  triggerError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('KocRealtimeService', () => {
  let service: KocRealtimeService;

  beforeEach(() => {
    service = new KocRealtimeService();
  });

  describe('connect()', () => {
    it('uses the KOC WebSocket endpoint when no streamUrl is provided', () => {
      let createdSocket: MockWebSocket | null = null;
      const socketFactory = (url: string) => {
        createdSocket = new MockWebSocket(url);
        return createdSocket as unknown as WebSocket;
      };

      const sub = service.connect({ socketFactory }).subscribe();

      expect(createdSocket).toBeTruthy();
      expect(createdSocket!.url).toBe('ws://localhost:31001/ai-agent-mcrs/ws/koc');

      sub.unsubscribe();
    });

    it('returns EMPTY when streamUrl is empty whitespace', () => {
      const nextSpy = vi.fn();
      let completed = false;

      service.connect({ streamUrl: '   ' }).subscribe({
        next: nextSpy,
        complete: () => {
          completed = true;
        },
      });

      expect(nextSpy).not.toHaveBeenCalled();
      expect(completed).toBe(true);
    });

    it('connects to WebSocket and emits parsed KocRealtimeEvent objects', () => {
      let createdSocket: MockWebSocket | null = null;
      const socketFactory = (url: string) => {
        createdSocket = new MockWebSocket(url);
        return createdSocket as unknown as WebSocket;
      };

      const emitted: KocRealtimeEvent[] = [];
      const sub = service
        .connect({
          streamUrl: 'wss://example.com/koc-events',
          socketFactory,
        })
        .subscribe((event) => emitted.push(event));

      expect(createdSocket).toBeTruthy();
      expect(createdSocket!.url).toBe('wss://example.com/koc-events');

      createdSocket!.triggerMessage(
        JSON.stringify({
          type: 'campaign.counters',
          aggregateId: 'camp-123',
          version: 2,
          payload: { discovered: 10 },
        }),
      );

      expect(emitted).toEqual([
        {
          type: 'campaign.counters',
          aggregateId: 'camp-123',
          version: 2,
          payload: { discovered: 10 },
        },
      ]);

      sub.unsubscribe();
      expect(createdSocket!.closed).toBe(true);
    });

    it('closes socket upon unsubscription', () => {
      let createdSocket: MockWebSocket | null = null;
      const socketFactory = (url: string) => {
        createdSocket = new MockWebSocket(url);
        return createdSocket as unknown as WebSocket;
      };

      const sub = service
        .connect({
          streamUrl: 'wss://example.com/koc-events',
          socketFactory,
        })
        .subscribe();

      expect(createdSocket!.closed).toBe(false);
      sub.unsubscribe();
      expect(createdSocket!.closed).toBe(true);
    });

    it('reconnects after connection close when reconnect is true', () => {
      vi.useFakeTimers();
      const sockets: MockWebSocket[] = [];
      const socketFactory = (url: string) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      };

      const emitted: KocRealtimeEvent[] = [];
      const sub = service
        .connect({
          streamUrl: 'wss://example.com/koc-events',
          reconnect: true,
          reconnectIntervalMs: 500,
          socketFactory,
        })
        .subscribe((event) => emitted.push(event));

      expect(sockets.length).toBe(1);

      // Close socket 1
      sockets[0].triggerClose();
      expect(sockets.length).toBe(1);

      // Advance timers by reconnect interval
      vi.advanceTimersByTime(500);
      expect(sockets.length).toBe(2);

      sockets[1].triggerMessage(
        JSON.stringify({
          type: 'candidate.status',
          aggregateId: 'cand-456',
          version: 3,
        }),
      );

      expect(emitted.length).toBe(1);
      expect(emitted[0].type).toBe('candidate.status');

      sub.unsubscribe();
      vi.useRealTimers();
    });

    it('handles socket creation failure and retries when reconnect is true', () => {
      vi.useFakeTimers();
      let callCount = 0;
      let secondSocket: MockWebSocket | null = null;
      const socketFactory = (url: string) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Socket network failure');
        }
        secondSocket = new MockWebSocket(url);
        return secondSocket as unknown as WebSocket;
      };

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const emitted: KocRealtimeEvent[] = [];
      const sub = service
        .connect({
          streamUrl: 'wss://example.com/koc-events',
          reconnect: true,
          reconnectIntervalMs: 300,
          socketFactory,
        })
        .subscribe((event) => emitted.push(event));

      expect(warnSpy).toHaveBeenCalledWith(
        'Unable to create WebSocket connection',
        expect.any(Error),
      );
      expect(callCount).toBe(1);

      vi.advanceTimersByTime(300);
      expect(callCount).toBe(2);
      expect(secondSocket).toBeTruthy();

      sub.unsubscribe();
      warnSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('isStaleEvent()', () => {
    it('returns false when currentVersion or event.version is undefined', () => {
      const eventWithVersion: KocRealtimeEvent = {
        type: 'campaign.counters',
        aggregateId: 'camp-1',
        version: 5,
      };
      const eventWithoutVersion: KocRealtimeEvent = {
        type: 'campaign.counters',
        aggregateId: 'camp-1',
      };

      expect(service.isStaleEvent(eventWithoutVersion, 5)).toBe(false);
      expect(service.isStaleEvent(eventWithVersion, undefined)).toBe(false);
      expect(service.isStaleEvent(eventWithoutVersion, undefined)).toBe(false);
    });

    it('returns true when event version is less than or equal to currentVersion', () => {
      const olderEvent: KocRealtimeEvent = {
        type: 'incident.status',
        aggregateId: 'inc-1',
        version: 3,
      };
      const equalEvent: KocRealtimeEvent = {
        type: 'incident.status',
        aggregateId: 'inc-1',
        version: 4,
      };

      expect(service.isStaleEvent(olderEvent, 4)).toBe(true);
      expect(service.isStaleEvent(equalEvent, 4)).toBe(true);
    });

    it('returns false when event version is strictly greater than currentVersion', () => {
      const newerEvent: KocRealtimeEvent = {
        type: 'incident.status',
        aggregateId: 'inc-1',
        version: 5,
      };

      expect(service.isStaleEvent(newerEvent, 4)).toBe(false);
    });
  });

  describe('parseMessage() and event validation', () => {
    it('validates supported KocRealtimeEventType values', () => {
      const types = [
        'campaign.counters',
        'candidate.status',
        'workflow.progress',
        'incident.status',
        'dependency.recovery',
      ] as const;

      for (const type of types) {
        const parsed = service.parseMessage(
          JSON.stringify({
            type,
            aggregateId: 'agg-1',
            version: 1,
            payload: { ok: true },
          }),
        );
        expect(parsed).toEqual({
          type,
          aggregateId: 'agg-1',
          version: 1,
          payload: { ok: true },
        });
      }
    });

    it('drops and warns on unsupported event types', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const parsed = service.parseMessage(
        JSON.stringify({
          type: 'unknown.event',
          aggregateId: 'agg-1',
        }),
      );

      expect(parsed).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Dropped invalid KOC realtime event payload:',
        expect.any(String),
      );
      warnSpy.mockRestore();
    });

    it('drops and warns on missing or empty aggregateId', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(service.parseMessage(JSON.stringify({ type: 'workflow.progress' }))).toBeNull();
      expect(
        service.parseMessage(JSON.stringify({ type: 'workflow.progress', aggregateId: '' })),
      ).toBeNull();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('drops and warns on malformed JSON', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const parsed = service.parseMessage('{not valid json');
      expect(parsed).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to parse KOC realtime message:',
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });
  });
});
