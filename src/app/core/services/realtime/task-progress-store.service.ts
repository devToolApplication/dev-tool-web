import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RealtimeProgressEvent, RealtimeTaskType, TaskProgressState } from '../../models/realtime/realtime.model';

@Injectable({ providedIn: 'root' })
export class TaskProgressStoreService {
  private readonly states = new Map<string, BehaviorSubject<TaskProgressState>>();

  getState$(taskType: RealtimeTaskType, taskId: string): Observable<TaskProgressState> {
    return this.getSubject(taskType, taskId).asObservable();
  }

  update(event: RealtimeProgressEvent): void {
    this.getSubject(event.taskType, event.taskId).next({
      taskId: event.taskId,
      taskType: event.taskType,
      status: event.status,
      progressPercent: event.progressPercent,
      step: event.step,
      message: event.message,
      current: event.current,
      total: event.total,
      payload: event.payload
    });
  }

  patch(state: TaskProgressState): void {
    this.getSubject(state.taskType, state.taskId).next(state);
  }

  private getSubject(taskType: RealtimeTaskType, taskId: string): BehaviorSubject<TaskProgressState> {
    const key = `${taskType}:${taskId}`;
    if (!this.states.has(key)) {
      this.states.set(
        key,
        new BehaviorSubject<TaskProgressState>({
          taskId,
          taskType,
          status: 'IDLE',
          progressPercent: 0
        })
      );
    }
    return this.states.get(key)!;
  }
}
