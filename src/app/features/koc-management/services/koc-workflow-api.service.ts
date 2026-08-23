import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  KocScreeningTemplateSummary,
  KocWorkflowTemplateSummary,
} from '../model/koc-workflow.model';

@Injectable({ providedIn: 'root' })
export class KocWorkflowApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/templates`;

  constructor(private readonly http: HttpClient) {}

  getWorkflowTemplates(): Observable<KocWorkflowTemplateSummary[]> {
    return this.http
      .get<BaseResponse<KocWorkflowTemplateSummary[]>>(`${this.baseUrl}/workflows`)
      .pipe(map((response) => response.data));
  }

  getScreeningTemplates(): Observable<KocScreeningTemplateSummary[]> {
    return this.http
      .get<BaseResponse<KocScreeningTemplateSummary[]>>(`${this.baseUrl}/screening`)
      .pipe(map((response) => response.data));
  }
}
