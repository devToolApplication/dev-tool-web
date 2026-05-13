import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import { RealtimeProgressEvent, RealtimeTaskType, TaskProgressState } from '../../models/realtime/realtime.model';

@Injectable({ providedIn: 'root' })
export class RealtimeTaskStateService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/realtime/tasks`;

  constructor(private readonly http: HttpClient) {}

  getLatestState(taskType: RealtimeTaskType, taskId: string): Observable<TaskProgressState | null> {
    return this.http.get<BaseResponse<RealtimeProgressEvent | null>>(`${this.apiUrl}/${taskType}/${taskId}/state`).pipe(
      map((res) => {
        const event = res.data;
        if (!event) {
          return null;
        }
        return {
          taskId: event.taskId,
          taskType: event.taskType,
          status: event.status,
          progressPercent: event.progressPercent,
          step: event.step,
          message: event.message,
          current: event.current,
          total: event.total,
          payload: event.payload
        };
      })
    );
  }
}
