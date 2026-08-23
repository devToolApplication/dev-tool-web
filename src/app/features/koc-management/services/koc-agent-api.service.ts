import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type { KocAgentCatalogItem } from '../model/koc-agent.model';

@Injectable({ providedIn: 'root' })
export class KocAgentApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/agents`;

  constructor(private readonly http: HttpClient) {}

  getAgents(): Observable<KocAgentCatalogItem[]> {
    return this.http
      .get<BaseResponse<KocAgentCatalogItem[]>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }
}
