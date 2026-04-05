import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { StrategyRuleCreateDto, StrategyRuleResponse, StrategyRuleUpdateDto } from '../../models/trade-bot/strategy-rule.model';

export interface StrategyRuleFilters {
  keyword?: string;
  strategyId?: string;
  strategyServiceName?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class StrategyRuleService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/strategy-rules`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters?: StrategyRuleFilters): Observable<StrategyRuleResponse[]> {
    let params = new HttpParams();
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<StrategyRuleResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(page = 0, size = 20, sort: string[] = ['code,asc'], filters?: StrategyRuleFilters): Observable<BasePageResponse<StrategyRuleResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });
    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<BaseResponse<BasePageResponse<StrategyRuleResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getById(id: string): Observable<StrategyRuleResponse> {
    return this.http.get<BaseResponse<StrategyRuleResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: StrategyRuleCreateDto): Observable<StrategyRuleResponse> {
    return this.http.post<BaseResponse<StrategyRuleResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: StrategyRuleUpdateDto): Observable<StrategyRuleResponse> {
    return this.http.put<BaseResponse<StrategyRuleResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<StrategyRuleResponse> {
    return this.http.delete<BaseResponse<StrategyRuleResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
