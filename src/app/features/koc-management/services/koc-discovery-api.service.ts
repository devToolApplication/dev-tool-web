import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocDiscoveryRun,
  KocDiscoveryRunStartResult,
  KocDiscoveryStrategySummary,
} from '../model/koc-discovery.model';

@Injectable({ providedIn: 'root' })
export class KocDiscoveryApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/discovery`;

  constructor(private readonly http: HttpClient) {}

  getCampaignStrategies(campaignId: string): Observable<KocDiscoveryStrategySummary[]> {
    return this.http
      .get<
        BaseResponse<KocDiscoveryStrategySummary[]>
      >(`${this.baseUrl}/campaigns/${campaignId}/strategies`)
      .pipe(map((response) => response.data));
  }

  getDiscoveryRun(runId: string): Observable<KocDiscoveryRun> {
    return this.http
      .get<BaseResponse<KocDiscoveryRun>>(`${this.baseUrl}/runs/${runId}`)
      .pipe(map((response) => response.data));
  }

  startDiscoveryRun(
    campaignId: string,
    strategyId: string,
  ): Observable<KocDiscoveryRunStartResult> {
    return this.http
      .post<
        BaseResponse<KocDiscoveryRunStartResult>
      >(`${this.baseUrl}/campaigns/${campaignId}/strategies/${strategyId}/runs`, null)
      .pipe(map((response) => response.data));
  }
}
