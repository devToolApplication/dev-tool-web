import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BaseResponse } from '../../models/base-response.model';

export interface TokenCacheTarget {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class TokenCacheService {
  private readonly targets: TokenCacheTarget[] = [
    { label: 'AI Agent MCRS', url: `${environment.apiUrl.aiGenerator.replace('/v1', '/v1/internal')}/token-cache` },
    { label: 'Trade Bot MCRS', url: `${environment.apiUrl.tradeBotUrl.replace('/v1', '/v1/internal')}/token-cache` }
  ];

  constructor(private readonly http: HttpClient) {}

  getTargets(): TokenCacheTarget[] {
    return this.targets;
  }

  clearCache(target: TokenCacheTarget): Observable<void> {
    return this.http.delete<BaseResponse<void>>(target.url).pipe(map(() => undefined));
  }

  clearAll(): Observable<void[]> {
    const requests = this.targets.map((t) => this.clearCache(t));
    return new Observable<void[]>((subscriber) => {
      const results: void[] = [];
      let completed = 0;
      requests.forEach((req, index) => {
        req.subscribe({
          next: (res) => {
            results[index] = res;
            completed++;
            if (completed === requests.length) {
              subscriber.next(results);
              subscriber.complete();
            }
          },
          error: (err) => {
            subscriber.error(err);
          }
        });
      });
    });
  }
}
