import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  AiAgentAvailableAgent,
  AiAgentExecutionRequest,
  AiAgentExecutionResponse,
  AiAgentSseEvent
} from '../../models/ai-agent/ai-agent-execution.model';

@Injectable({ providedIn: 'root' })
export class AiAgentExecutionService {
  private readonly apiUrl = `${environment.apiUrl.aiGenerator}/ai-agent-executions`;

  constructor(
    private readonly http: HttpClient,
    private readonly ngZone: NgZone
  ) {}

  getAvailableAgents(): Observable<AiAgentAvailableAgent[]> {
    return this.http.get<BaseResponse<AiAgentAvailableAgent[]>>(`${this.apiUrl}/agents`).pipe(
      map((res) => res.data ?? [])
    );
  }

  execute(request: AiAgentExecutionRequest): Observable<AiAgentExecutionResponse> {
    return this.http.post<BaseResponse<AiAgentExecutionResponse>>(this.apiUrl, request).pipe(
      map((res) => res.data)
    );
  }

  stream(request: AiAgentExecutionRequest, token: string): Observable<AiAgentSseEvent> {
    return new Observable<AiAgentSseEvent>((subscriber) => {
      const abortController = new AbortController();

      this.ngZone.runOutsideAngular(() => {
        fetch(`${this.apiUrl}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(request),
          signal: abortController.signal
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.body;
          })
          .then((body) => {
            if (!body) {
              subscriber.complete();
              return;
            }

            const reader = body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const read = (): void => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  this.ngZone.run(() => subscriber.complete());
                  return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed.startsWith(':')) continue;

                  if (trimmed.startsWith('data:')) {
                    const jsonStr = trimmed.slice(5).trim();
                    if (!jsonStr) continue;

                    try {
                      const event: AiAgentSseEvent = JSON.parse(jsonStr);
                      this.ngZone.run(() => subscriber.next(event));
                    } catch {
                      // skip non-JSON data lines
                    }
                  }
                }

                read();
              }).catch((err) => {
                if (err.name !== 'AbortError') {
                  this.ngZone.run(() => subscriber.error(err));
                }
              });
            };

            read();
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              this.ngZone.run(() => subscriber.error(err));
            }
          });
      });

      return () => {
        abortController.abort();
      };
    });
  }
}
