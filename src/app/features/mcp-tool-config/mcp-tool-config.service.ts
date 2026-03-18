import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { McpToolConfig, McpToolUpsertPayload } from './mcp-tool.models';

@Injectable({ providedIn: 'root' })
export class McpToolConfigService {
  private readonly store$ = new BehaviorSubject<McpToolConfig[]>([
    {
      id: 'tool_1',
      category: 'jira',
      name: 'jira-ticket-sync',
      endpoint: 'https://jira.internal.company/api',
      authType: 'oauth',
      enabled: true,
      timeoutMs: 12000,
      retryCount: 2,
      description: 'Đồng bộ issue, sprint, board metadata cho AI agent.',
      scopes: ['read:issue', 'read:sprint'],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tool_2',
      category: 'github',
      name: 'github-repo-insight',
      endpoint: 'https://api.github.com',
      authType: 'api_key',
      enabled: true,
      timeoutMs: 9000,
      retryCount: 3,
      description: 'Đọc commit, PR, release để hỗ trợ code reasoning.',
      scopes: ['repo:read', 'pull_request:read'],
      updatedAt: new Date().toISOString()
    }
  ]);

  list(): Observable<McpToolConfig[]> {
    return this.store$.asObservable();
  }

  getById(id: string): Observable<McpToolConfig | undefined> {
    return this.store$.pipe(map((rows) => rows.find((row) => row.id === id)));
  }

  create(payload: McpToolUpsertPayload): Observable<McpToolConfig> {
    const next: McpToolConfig = {
      id: `tool_${Date.now()}`,
      ...payload,
      updatedAt: new Date().toISOString()
    };

    this.store$.next([next, ...this.store$.value]);
    return of(next);
  }

  update(id: string, payload: McpToolUpsertPayload): Observable<McpToolConfig | undefined> {
    let updated: McpToolConfig | undefined;
    const rows = this.store$.value.map((row) => {
      if (row.id !== id) {
        return row;
      }

      updated = {
        ...row,
        ...payload,
        updatedAt: new Date().toISOString()
      };

      return updated;
    });

    this.store$.next(rows);
    return of(updated);
  }

  remove(id: string): Observable<void> {
    this.store$.next(this.store$.value.filter((row) => row.id !== id));
    return of(void 0);
  }
}
