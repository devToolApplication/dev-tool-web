import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponse } from '@core/http/base-response.model';
import { KeycloakService } from '@core/auth/keycloak.service';
import { environment } from '../../../../enviroment/environment';
import {
  CodexAgentCatalogItem,
  CodexPromptRequest,
  CodexThreadDetail,
  CodexThreadListResponse,
} from '../models/codex-sdk.model';

@Injectable({
  providedIn: 'root',
})
export class CodexSdkService {
  private readonly baseUrl = `${environment.apiUrl.aiGenerator}/codex-sdk`;

  constructor(
    private readonly http: HttpClient,
    private readonly keycloak: KeycloakService
  ) {}

  getThreads(params?: {
    limit?: number;
    cursor?: string;
    searchTerm?: string;
    archived?: boolean;
  }): Observable<CodexThreadListResponse> {
    let httpParams = new HttpParams();
    if (params?.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit);
    }
    if (params?.cursor) {
      httpParams = httpParams.set('cursor', params.cursor);
    }
    if (params?.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }
    if (params?.archived !== undefined) {
      httpParams = httpParams.set('archived', params.archived);
    }

    return this.http
      .get<BaseResponse<CodexThreadListResponse>>(`${this.baseUrl}/threads`, {
        params: httpParams,
      })
      .pipe(map((res) => res.data));
  }

  getThreadHistory(threadId: string): Observable<CodexThreadDetail> {
    const encodedId = encodeURIComponent(threadId);
    return this.http
      .get<BaseResponse<CodexThreadDetail>>(`${this.baseUrl}/threads/${encodedId}`)
      .pipe(map((res) => res.data));
  }

  getAgents(): Observable<CodexAgentCatalogItem[]> {
    return this.http
      .get<BaseResponse<CodexAgentCatalogItem[]>>(`${this.baseUrl}/agents`)
      .pipe(map((res) => res.data ?? []));
  }

  streamPrompt(
    request: CodexPromptRequest,
    onToken: (token: string) => void,
    onError: (err: unknown) => void,
    onDone: (taskId?: string) => void,
    onToolCall?: (toolCall: unknown) => void,
    onPreflight?: (preflight: any) => void,
    onReasoning?: (reasoning: string) => void,
    onStderr?: (stderr: string) => void,
    onTaskId?: (taskId: string) => void
  ): AbortController {
    const controller = new AbortController();

    (async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        const token = this.keycloak?.token;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE streaming failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported or empty body in response.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let buffer = '';
        let detectedTaskId: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const lines = part.split('\n');
            let eventType = 'message';
            let dataContent = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                // Keep trailing whitespace if any after 'data: '
                const rawData = line.slice(5);
                dataContent = rawData.startsWith(' ') ? rawData.slice(1) : rawData;
              }
            }

            if (eventType === 'done') {
              onDone(detectedTaskId);
              return;
            }

            if (eventType === 'error') {
              onError(new Error(dataContent || 'Stream error'));
              return;
            }

            if (eventType === 'tool_call') {
              try {
                const parsed = JSON.parse(dataContent);
                onToolCall?.(parsed);
              } catch {
                onToolCall?.(dataContent);
              }
            } else if (dataContent) {
              this.processStreamData(
                dataContent,
                onToken,
                onPreflight,
                onReasoning,
                onStderr,
                (id) => {
                  detectedTaskId = id;
                  onTaskId?.(id);
                }
              );
            }
          }
        }

        onDone(detectedTaskId);
      } catch (error: unknown) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          onError(error);
        }
      }
    })();

    return controller;
  }

  processStreamData(
    raw: string,
    onToken: (token: string) => void,
    onPreflight?: (preflight: any) => void,
    onReasoning?: (reasoning: string) => void,
    onStderr?: (stderr: string) => void,
    onTaskId?: (taskId: string) => void
  ): void {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (parsed.taskId && typeof parsed.taskId === 'string') {
          onTaskId?.(parsed.taskId);
        }
        if (parsed.type === 'heartbeat') {
          return;
        }
        if (parsed.type === 'preflight') {
          onPreflight?.(parsed.preflight);
          return;
        }
        if (parsed.type === 'stderr') {
          onStderr?.(parsed.data || '');
          return;
        }
        if (parsed.type === 'stdout' && typeof parsed.data === 'string') {
          this.processRawCodexLines(parsed.data, onToken, onReasoning, onPreflight, onStderr, onTaskId);
          return;
        }
        if (parsed.type === 'result') {
          if (parsed.result?.execution?.stderr) {
            onStderr?.(parsed.result.execution.stderr);
          }
          return;
        }
        if (parsed.type === 'item.completed' && parsed.item) {
          if (parsed.item.type === 'agent_message' && parsed.item.text) {
            onToken(parsed.item.text);
          } else if (parsed.item.type === 'reasoning' && parsed.item.text) {
            onReasoning?.(parsed.item.text);
          }
          return;
        }
        if (
          parsed.type === 'thread.started' ||
          parsed.type === 'turn.started' ||
          parsed.type === 'turn.completed'
        ) {
          if (parsed.thread_id && typeof parsed.thread_id === 'string') {
            onTaskId?.(parsed.thread_id);
          }
          return;
        }
      }
    } catch {
      // If raw contains multiple lines, parse line by line
      if (trimmed.includes('\n')) {
        this.processRawCodexLines(trimmed, onToken, onReasoning, onPreflight, onStderr, onTaskId);
        return;
      }
    }

    onToken(raw);
  }

  processRawCodexLines(
    text: string,
    onToken: (token: string) => void,
    onReasoning?: (reasoning: string) => void,
    onPreflight?: (preflight: any) => void,
    onStderr?: (stderr: string) => void,
    onTaskId?: (taskId: string) => void
  ): void {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      try {
        const obj = JSON.parse(trimmedLine);
        if (obj && typeof obj === 'object') {
          if (obj.taskId && typeof obj.taskId === 'string') {
            onTaskId?.(obj.taskId);
          }
          if (obj.type === 'heartbeat') {
            continue;
          }
          if (obj.type === 'preflight') {
            onPreflight?.(obj.preflight);
            continue;
          }
          if (obj.type === 'stderr') {
            onStderr?.(obj.data || '');
            continue;
          }
          if (obj.type === 'stdout' && typeof obj.data === 'string') {
            this.processRawCodexLines(obj.data, onToken, onReasoning, onPreflight, onStderr, onTaskId);
            continue;
          }
          if (obj.type === 'item.completed' && obj.item) {
            if (obj.item.type === 'agent_message' && obj.item.text) {
              onToken(obj.item.text);
            } else if (obj.item.type === 'reasoning' && obj.item.text) {
              onReasoning?.(obj.item.text);
            }
            continue;
          }
          if (
            obj.type === 'thread.started' ||
            obj.type === 'turn.started' ||
            obj.type === 'turn.completed'
          ) {
            if (obj.thread_id && typeof obj.thread_id === 'string') {
              onTaskId?.(obj.thread_id);
            }
            continue;
          }
          if (obj.type === 'agent_message' && obj.text) {
            onToken(obj.text);
            continue;
          }
          if (obj.type === 'result') {
            continue;
          }
        }
      } catch {
        onToken(trimmedLine);
      }
    }
  }
}
