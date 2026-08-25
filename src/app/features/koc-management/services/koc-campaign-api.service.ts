import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocCandidateEvaluationStartPayload,
  KocCandidateEvaluationStartResult,
  KocCampaignDetail,
  KocCampaignListQuery,
  KocCampaignSummary,
  KocCampaignUpsertPayload,
} from '../model/koc-campaign.model';

@Injectable({ providedIn: 'root' })
export class KocCampaignApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/campaigns`;

  constructor(private readonly http: HttpClient) {}

  getCampaignPage(
    query: KocCampaignListQuery = {},
  ): Observable<BasePageResponse<KocCampaignSummary>> {
    return this.http
      .get<BaseResponse<BasePageResponse<KocCampaignSummary>>>(`${this.baseUrl}/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .get<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}`)
      .pipe(map((response) => response.data));
  }

  createCampaign(payload: KocCampaignUpsertPayload): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateCampaign(
    campaignId: string,
    payload: KocCampaignUpsertPayload,
  ): Observable<KocCampaignDetail> {
    return this.http
      .put<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}`, payload)
      .pipe(map((response) => response.data));
  }

  startCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}/start`, null)
      .pipe(map((response) => response.data));
  }

  pauseCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}/pause`, null)
      .pipe(map((response) => response.data));
  }

  resumeCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}/resume`, null)
      .pipe(map((response) => response.data));
  }

  cloneCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}/clone`, null)
      .pipe(map((response) => response.data));
  }

  stopCampaign(campaignId: string): Observable<KocCampaignDetail> {
    return this.http
      .post<BaseResponse<KocCampaignDetail>>(`${this.baseUrl}/${campaignId}/stop`, null)
      .pipe(map((response) => response.data));
  }

  startCandidateEvaluation(
    campaignId: string,
    payload: KocCandidateEvaluationStartPayload,
  ): Observable<KocCandidateEvaluationStartResult> {
    return this.http
      .post<
        BaseResponse<KocCandidateEvaluationStartResult>
      >(`${this.baseUrl}/${campaignId}/candidate-evaluations`, payload)
      .pipe(map((response) => response.data));
  }

  private pageParams(query: KocCampaignListQuery): HttpParams {
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

    return params;
  }
}
