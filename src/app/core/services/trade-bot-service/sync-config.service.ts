import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { SyncConfigCreateDto, SyncConfigResponse, SyncConfigUpdateDto } from '../../models/trade-bot/sync-config.model';

@Injectable({ providedIn: 'root' })
export class SyncConfigService {
  private readonly apiUrl = `${environment.apiUrl.tradeBotAdminUrl}/sync-configs`;

  constructor(private readonly http: HttpClient) {}

  getPage(page = 0, size = 10, sort: string[] = ['symbol,asc']): Observable<BasePageResponse<SyncConfigResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => {
      params = params.append('sort', item);
    });

    return this.http
      .get<BaseResponse<BasePageResponse<SyncConfigResponse>>>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((res) => ({
          data: res.data?.data ?? [],
          metadata: normalizePageMetadata(res.data?.metadata, page, size)
        }))
      );
  }

  getById(id: string): Observable<SyncConfigResponse> {
    return this.http.get<BaseResponse<SyncConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: SyncConfigCreateDto): Observable<SyncConfigResponse> {
    return this.http.post<BaseResponse<SyncConfigResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: SyncConfigUpdateDto): Observable<SyncConfigResponse> {
    return this.http.put<BaseResponse<SyncConfigResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<SyncConfigResponse> {
    return this.http.delete<BaseResponse<SyncConfigResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  syncAll(id: string): Observable<boolean> {
    return this.http.post<BaseResponse<boolean>>(`${this.apiUrl}/${id}/sync-all`, {}).pipe(map((res) => res.data));
  }
}
