import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import {
  AccountCreateRequest,
  AccountItem,
  AccountQueryParams,
  AccountUpdateRequest,
} from '../models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/accounts`;

  constructor(private readonly http: HttpClient) {}

  getPage(params: AccountQueryParams): Observable<BasePageResponse<AccountItem>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<BaseResponse<BasePageResponse<AccountItem>>>(`${this.baseUrl}/page`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<AccountItem> {
    return this.http
      .get<BaseResponse<AccountItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(req: AccountCreateRequest): Observable<AccountItem> {
    return this.http
      .post<BaseResponse<AccountItem>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  update(id: string, req: AccountUpdateRequest): Observable<AccountItem> {
    return this.http
      .put<BaseResponse<AccountItem>>(`${this.baseUrl}/${id}`, req)
      .pipe(map((res) => res.data));
  }

  delete(id: string): Observable<AccountItem> {
    return this.http
      .delete<BaseResponse<AccountItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }
}
