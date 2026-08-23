import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocIncidentDetail,
  KocIncidentListQuery,
  KocIncidentSummary,
  KocRecoveryProgress,
} from '../model/koc-incident.model';

@Injectable({ providedIn: 'root' })
export class KocIncidentApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/incidents`;

  constructor(private readonly http: HttpClient) {}

  getIncidentPage(query: KocIncidentListQuery = {}): Observable<BasePageResponse<KocIncidentSummary>> {
    return this.http
      .get<BaseResponse<BasePageResponse<KocIncidentSummary>>>(`${this.baseUrl}/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getIncident(incidentId: string): Observable<KocIncidentDetail> {
    return this.http
      .get<BaseResponse<KocIncidentDetail>>(`${this.baseUrl}/${incidentId}`)
      .pipe(map((response) => response.data));
  }

  testDependency(incidentId: string): Observable<KocIncidentDetail> {
    return this.http
      .post<BaseResponse<KocIncidentDetail>>(`${this.baseUrl}/${incidentId}/test-dependency`, null)
      .pipe(map((response) => response.data));
  }

  markIssueFixed(incidentId: string): Observable<KocRecoveryProgress> {
    return this.http
      .post<BaseResponse<KocRecoveryProgress>>(`${this.baseUrl}/${incidentId}/mark-fixed`, null)
      .pipe(map((response) => response.data));
  }

  private pageParams(query: KocIncidentListQuery): HttpParams {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }
    if (query.size !== undefined) {
      params = params.set('size', query.size);
    }
    (query.sort ?? []).forEach((sort) => {
      params = params.append('sort', sort);
    });
    if (query.search) {
      params = params.set('search', query.search);
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.dependencyKey) {
      params = params.set('dependencyKey', query.dependencyKey);
    }

    return params;
  }
}
