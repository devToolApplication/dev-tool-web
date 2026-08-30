import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocCandidateDetail,
  KocCandidateListQuery,
  KocCandidateSummary,
} from '../model/koc-candidate.model';
import type { KocEvidenceItem } from '../model/koc-evidence.model';
import type {
  KocReviewDecisionPayload,
  KocReviewHistoryItem,
  KocReviewQueueItem,
} from '../model/koc-review.model';

@Injectable({ providedIn: 'root' })
export class KocCandidateApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/candidates`;

  constructor(private readonly http: HttpClient) {}

  getCandidatePage(query: KocCandidateListQuery = {}): Observable<BasePageResponse<KocCandidateSummary>> {
    return this.http
      .get<BaseResponse<BasePageResponse<KocCandidateSummary>>>(`${this.baseUrl}/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getCandidate(candidateId: string): Observable<KocCandidateDetail> {
    return this.http
      .get<BaseResponse<KocCandidateDetail>>(`${this.baseUrl}/${candidateId}`)
      .pipe(map((response) => response.data));
  }

  getEvidence(candidateId: string): Observable<KocEvidenceItem[]> {
    return this.http
      .get<BaseResponse<KocEvidenceItem[]>>(`${this.baseUrl}/${candidateId}/evidence`)
      .pipe(map((response) => response.data));
  }

  getReviewHistory(candidateId: string): Observable<KocReviewHistoryItem[]> {
    return this.http
      .get<BaseResponse<KocReviewHistoryItem[]>>(`${this.baseUrl}/${candidateId}/reviews`)
      .pipe(map((response) => response.data));
  }

  decideCandidate(
    candidateId: string,
    payload: KocReviewDecisionPayload,
  ): Observable<KocReviewQueueItem> {
    return this.http
      .post<BaseResponse<KocReviewQueueItem>>(`${this.baseUrl}/${candidateId}/reviews`, payload)
      .pipe(map((response) => response.data));
  }

  private pageParams(query: KocCandidateListQuery): HttpParams {
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
    if (query.campaignId) {
      params = params.set('campaignId', query.campaignId);
    }
    if (query.decision) {
      params = params.set('decision', query.decision);
    }
    if (query.executionStatus) {
      params = params.set('executionStatus', query.executionStatus);
    }
    if (query.rejectReason) {
      params = params.set('rejectReason', query.rejectReason);
    }
    if (query.minFollowers !== undefined) {
      params = params.set('minFollowers', query.minFollowers);
    }
    if (query.maxFollowers !== undefined) {
      params = params.set('maxFollowers', query.maxFollowers);
    }

    return params;
  }
}
