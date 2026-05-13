import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { RealtimeCommand, RealtimeProgressEvent, RealtimeTaskType } from '../../models/realtime/realtime.model';

export type ReplayCommandType =
  | 'PLAY_REPLAY'
  | 'PAUSE_REPLAY'
  | 'STOP_REPLAY'
  | 'NEXT_CANDLE'
  | 'PREVIOUS_CANDLE'
  | 'CHANGE_REPLAY_SPEED'
  | 'JUMP_TO_INDEX';

@Injectable({ providedIn: 'root' })
export class RealtimeWebSocketService {
  private client?: Client;

  connect(): void {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: environment.ws.tradeBotWs,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });
    this.client.activate();
  }

  subscribeProgress(taskType: RealtimeTaskType, taskId: string): Observable<RealtimeProgressEvent> {
    return this.subscribeTopic(`/topic/progress/${taskType}/${taskId}`);
  }

  subscribeReplay(sessionId: string): Observable<RealtimeProgressEvent> {
    return this.subscribeTopic(`/topic/replay/${sessionId}`);
  }

  sendReplayCommand(sessionId: string, commandType: ReplayCommandType, payload: Record<string, unknown> = {}): void {
    this.publish('/app/replay/control', {
      commandId: crypto.randomUUID(),
      commandType,
      taskType: 'REPLAY',
      taskId: sessionId,
      payload,
      timestamp: new Date().toISOString()
    });
  }

  cancelTask(taskType: RealtimeTaskType, taskId: string): void {
    this.publish('/app/tasks/cancel', {
      commandId: crypto.randomUUID(),
      commandType: 'CANCEL_TASK',
      taskType,
      taskId,
      payload: {},
      timestamp: new Date().toISOString()
    });
  }

  pauseTask(taskType: RealtimeTaskType, taskId: string): void {
    this.publish('/app/tasks/pause', {
      commandId: crypto.randomUUID(),
      commandType: 'PAUSE_TASK',
      taskType,
      taskId,
      payload: {},
      timestamp: new Date().toISOString()
    });
  }

  resumeTask(taskType: RealtimeTaskType, taskId: string): void {
    this.publish('/app/tasks/resume', {
      commandId: crypto.randomUUID(),
      commandType: 'RESUME_TASK',
      taskType,
      taskId,
      payload: {},
      timestamp: new Date().toISOString()
    });
  }

  private subscribeTopic(destination: string): Observable<RealtimeProgressEvent> {
    this.connect();
    return new Observable<RealtimeProgressEvent>((observer) => {
      let subscription: StompSubscription | undefined;
      const subscribe = () => {
        subscription = this.client?.subscribe(destination, (message: IMessage) => {
          observer.next(JSON.parse(message.body) as RealtimeProgressEvent);
        });
      };

      if (this.client?.connected) {
        subscribe();
      } else if (this.client) {
        const previous = this.client.onConnect;
        this.client.onConnect = (frame) => {
          previous?.(frame);
          subscribe();
        };
      }

      return () => subscription?.unsubscribe();
    });
  }

  private publish(destination: string, command: RealtimeCommand): void {
    this.connect();
    this.client?.publish({ destination, body: JSON.stringify(command) });
  }
}
