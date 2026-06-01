import { Injectable, OnDestroy, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../../enviroment/environment';

export interface WebSocketStatusEvent {
  type: 'NODE_STATUS_CHANGED' | 'RUN_STATUS_CHANGED';
  workflowRunId: string;
  nodeId?: string;
  nodeType?: string;
  status?: string;
  workflowRunStatus?: string;
  currentNodeId?: string;
  timestamp: number;
}

export interface WebSocketStepResultEvent {
  type: 'STEP_RESULT';
  workflowRunId: string;
  stepRunId: string;
  nodeId: string;
  nodeType: string;
  status: string;
  summary: string;
  dataJsonPreview: string;
  hasFullResult: boolean;
  tokenUsage: { prompt: number; completion: number; total: number };
  durationMs: number;
  timestamp: number;
}

export interface WebSocketReviewEvent {
  type: 'REVIEW_REQUESTED';
  workflowRunId: string;
  workflowName: string;
  stepRunId: string;
  nodeId: string;
  reviewInstructions: string;
  previousStepSummary: string;
  timestamp: number;
}

export interface WebSocketDashboardEvent {
  type: 'DASHBOARD_METRICS';
  totalRunsToday: number;
  successRate: number;
  activeRuns: number;
  pendingReviews: number;
  timestamp: number;
}

export type WebSocketEvent = WebSocketStatusEvent | WebSocketStepResultEvent | WebSocketReviewEvent | WebSocketDashboardEvent;

@Injectable({ providedIn: 'root' })
export class AiAgentWebSocketService implements OnDestroy {

  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  // Connection state
  readonly connected = signal(false);
  readonly connectionError = signal<string | null>(null);

  // Event callbacks
  private eventHandlers = new Map<string, ((event: WebSocketEvent) => void)[]>();

  connect(token: string): void {
    if (this.client?.connected) return;

    const wsUrl = this.buildWsUrl();

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0, // We handle reconnect manually
      heartbeatIncoming: 30000,
      heartbeatOutgoing: 30000,
      onConnect: () => {
        this.connected.set(true);
        this.connectionError.set(null);
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      },
      onStompError: (frame) => {
        this.connected.set(false);
        this.connectionError.set(frame.headers['message'] || 'STOMP error');
        this.handleReconnect(token);
      },
      onWebSocketClose: () => {
        this.connected.set(false);
        this.handleReconnect(token);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.eventHandlers.clear();
    this.client?.deactivate();
    this.client = null;
    this.connected.set(false);
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to workflow run status updates.
   */
  subscribeRunStatus(runId: string, handler: (event: WebSocketStatusEvent) => void): void {
    const destination = `/topic/workflow-runs/${runId}/status`;
    this.subscribe(destination, handler as (event: WebSocketEvent) => void);
  }

  /**
   * Subscribe to workflow run step results.
   */
  subscribeRunResults(runId: string, handler: (event: WebSocketStepResultEvent) => void): void {
    const destination = `/topic/workflow-runs/${runId}/results`;
    this.subscribe(destination, handler as (event: WebSocketEvent) => void);
  }

  /**
   * Subscribe to pending review notifications.
   */
  subscribeReviews(handler: (event: WebSocketReviewEvent) => void): void {
    const destination = '/topic/reviews/pending';
    this.subscribe(destination, handler as (event: WebSocketEvent) => void);
  }

  /**
   * Subscribe to dashboard metrics updates.
   */
  subscribeDashboard(handler: (event: WebSocketDashboardEvent) => void): void {
    const destination = '/topic/dashboard/metrics';
    this.subscribe(destination, handler as (event: WebSocketEvent) => void);
  }

  /**
   * Unsubscribe from a specific destination.
   */
  unsubscribe(destination: string): void {
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    }
    this.eventHandlers.delete(destination);
  }

  /**
   * Unsubscribe from all run-specific topics.
   */
  unsubscribeRun(runId: string): void {
    this.unsubscribe(`/topic/workflow-runs/${runId}/status`);
    this.unsubscribe(`/topic/workflow-runs/${runId}/results`);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // --- Private ---

  private subscribe(destination: string, handler: (event: WebSocketEvent) => void): void {
    // Store handler for resubscription on reconnect
    if (!this.eventHandlers.has(destination)) {
      this.eventHandlers.set(destination, []);
    }
    this.eventHandlers.get(destination)!.push(handler);

    // Subscribe if connected
    if (this.client?.connected) {
      this.doSubscribe(destination);
    }
  }

  private doSubscribe(destination: string): void {
    if (this.subscriptions.has(destination)) return;

    const sub = this.client!.subscribe(destination, (message: IMessage) => {
      try {
        const event: WebSocketEvent = JSON.parse(message.body);
        const handlers = this.eventHandlers.get(destination) || [];
        handlers.forEach((h) => h(event));
      } catch (e) {
        // Ignore parse errors
      }
    });

    this.subscriptions.set(destination, sub);
  }

  private resubscribeAll(): void {
    // Clear old subscriptions (they're invalid after reconnect)
    this.subscriptions.clear();
    // Re-subscribe to all registered destinations
    this.eventHandlers.forEach((_, destination) => {
      this.doSubscribe(destination);
    });
  }

  private handleReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionError.set('Connection lost — max retries reached. Click to retry.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.calculateBackoff(this.reconnectAttempts);

    setTimeout(() => {
      if (!this.connected()) {
        this.client?.deactivate();
        this.client = null;
        this.connect(token);
      }
    }, delay);
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  }

  private buildWsUrl(): string {
    // Convert HTTP URL to WS URL for SockJS endpoint
    const baseUrl = environment.apiUrl.adminAiGenerator || '';
    const httpBase = baseUrl.replace(/\/v1.*$/, '');
    return httpBase.replace(/^http/, 'ws') + '/ws/ai-agent/websocket';
  }
}
