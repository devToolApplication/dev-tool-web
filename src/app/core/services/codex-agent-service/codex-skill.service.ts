import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../enviroment/environment';
import { BasePageResponse, BaseResponse, normalizePageMetadata } from '../../models/base-response.model';
import { CodexSkillCreateDto, CodexSkillResponse, CodexSkillUpdateDto } from '../../models/codex-agent/codex-skill.model';

@Injectable({ providedIn: 'root' })
export class CodexSkillService {
  private readonly apiUrl = `${environment.apiUrl.adminAiGenerator}/codex-skills`;

  constructor(private readonly http: HttpClient) {}

  getAll(filters: Record<string, any> = {}): Observable<CodexSkillResponse[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<BaseResponse<CodexSkillResponse[]>>(this.apiUrl, { params }).pipe(map((res) => res.data ?? []));
  }

  getPage(
    page = 0,
    size = 10,
    sort: string[] = ['name,asc'],
    filters: Record<string, any> = {}
  ): Observable<BasePageResponse<CodexSkillResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    sort.forEach((item) => (params = params.append('sort', item)));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<BaseResponse<BasePageResponse<CodexSkillResponse>>>(`${this.apiUrl}/page`, { params }).pipe(
      map((res) => ({
        data: res.data?.data ?? [],
        metadata: normalizePageMetadata(res.data?.metadata, page, size)
      }))
    );
  }

  getById(id: string): Observable<CodexSkillResponse> {
    return this.http.get<BaseResponse<CodexSkillResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: CodexSkillCreateDto): Observable<CodexSkillResponse> {
    return this.http.post<BaseResponse<CodexSkillResponse>>(this.apiUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: CodexSkillUpdateDto): Observable<CodexSkillResponse> {
    return this.http.put<BaseResponse<CodexSkillResponse>>(`${this.apiUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<CodexSkillResponse> {
    return this.http.delete<BaseResponse<CodexSkillResponse>>(`${this.apiUrl}/${id}`).pipe(map((res) => res.data));
  }
}
