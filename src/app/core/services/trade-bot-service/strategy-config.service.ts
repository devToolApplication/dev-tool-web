import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse } from '../../models/base-response.model';
import { StrategyCreateDto, StrategyResponse, StrategyUpdateDto } from '../../models/trade-bot/reference-data.model';

@Injectable({ providedIn: 'root' })
export class StrategyConfigService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/strategies`;

  constructor(private readonly http: HttpClient) {}

  getPage(page = 0, size = 10, sort: string[] = ['code,asc'], filters?: { keyword?: string; status?: string }): Observable<BasePageResponse<StrategyResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    if (filters?.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http
      .get<BaseResponse<BasePageResponse<StrategyResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: res.data?.metadata ?? { pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0 }
        }))
      );
  }

  getById(id: string): Observable<StrategyResponse> {
    return this.http.get<BaseResponse<StrategyResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: StrategyCreateDto): Observable<StrategyResponse> {
    return this.http.post<BaseResponse<StrategyResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: StrategyUpdateDto): Observable<StrategyResponse> {
    return this.http.put<BaseResponse<StrategyResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<StrategyResponse> {
    return this.http.delete<BaseResponse<StrategyResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
