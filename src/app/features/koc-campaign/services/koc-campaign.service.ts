import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import {
  KocCampaignCloneRequest,
  KocCampaignCreateRequest,
  KocCampaignItem,
  KocCampaignQueryParams,
  KocCampaignUpdateRequest,
  KocCandidateItem,
} from '../models/koc-campaign.model';

@Injectable({
  providedIn: 'root',
})
export class KocCampaignService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc-campaigns`;

  constructor(private readonly http: HttpClient) {}

  getCampaignPage(params: KocCampaignQueryParams): Observable<BasePageResponse<KocCampaignItem>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.niche) httpParams = httpParams.set('niche', params.niche);
    if (params.workflowStatus) httpParams = httpParams.set('workflowStatus', params.workflowStatus);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);

    return this.http
      .get<BaseResponse<BasePageResponse<KocCampaignItem>>>(`${this.baseUrl}/page`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getCampaignById(id: string): Observable<KocCampaignItem> {
    return this.http
      .get<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  getCampaignCandidates(id: string): Observable<KocCandidateItem[]> {
    return this.http
      .get<BaseResponse<KocCandidateItem[]>>(`${this.baseUrl}/${id}/candidates`)
      .pipe(map((res) => res.data || []));
  }

  createAndStartCampaign(req: KocCampaignCreateRequest): Observable<KocCampaignItem> {
    return this.http
      .post<BaseResponse<KocCampaignItem>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  cloneCampaign(id: string, req?: KocCampaignCloneRequest): Observable<KocCampaignItem> {
    return this.http
      .post<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}/clone`, req ?? {})
      .pipe(map((res) => res.data));
  }

  updateCampaign(id: string, req: KocCampaignUpdateRequest): Observable<KocCampaignItem> {
    return this.http
      .put<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`, req)
      .pipe(map((res) => res.data));
  }

  deleteCampaign(id: string): Observable<KocCampaignItem> {
    return this.http
      .delete<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
