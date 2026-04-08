import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import { AiAgentAskRequest, AiAgentAskResponse } from '../../models/ai-agent/ai-agent-ask.model';

@Injectable({ providedIn: 'root' })
export class AiAgentAdminService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/ai-agent`;

  constructor(private readonly http: HttpClient) {}

  ask(payload: AiAgentAskRequest): Observable<AiAgentAskResponse> {
    return this.http.post<BaseResponse<AiAgentAskResponse>>(`${this.apiUrl}/ask`, payload).pipe(map((res) => res.data));
  }
}
