import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocReviewDecisionPayload,
  KocReviewListQuery,
  KocReviewQueueItem,
} from '../model/koc-review.model';

@Injectable({ providedIn: 'root' })
export class KocReviewApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/reviews`;

  constructor(private readonly http: HttpClient) {}

  getReviewQueue(query: KocReviewListQuery = {}): Observable<BasePageResponse<KocReviewQueueItem>> {
    return this.http
      .get<BaseResponse<BasePageResponse<KocReviewQueueItem>>>(`${this.baseUrl}/page`, {
        params: this.pageParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getReview(reviewId: string): Observable<KocReviewQueueItem> {
    return this.http
      .get<BaseResponse<KocReviewQueueItem>>(`${this.baseUrl}/${reviewId}`)
      .pipe(map((response) => response.data));
  }

  submitDecision(reviewId: string, payload: KocReviewDecisionPayload): Observable<KocReviewQueueItem> {
    return this.http
      .post<BaseResponse<KocReviewQueueItem>>(`${this.baseUrl}/${reviewId}/decision`, payload)
      .pipe(map((response) => response.data));
  }

  private pageParams(query: KocReviewListQuery): HttpParams {
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
