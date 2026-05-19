import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../../enviroment/environment';
import { BaseResponse } from '../../../../../core/models/base-response.model';
import {
  DataFormCodeCheckResponse,
  DataFormCreateRequest,
  DataFormCreateResponse
} from '../models/data-form.model';

@Injectable({ providedIn: 'root' })
export class DataFormService {
  private readonly apiUrl = `${environment.apiUrl.bpmEngineAdminUrl}/data-forms`;

  constructor(private readonly http: HttpClient) {}

  create(payload: DataFormCreateRequest): Observable<DataFormCreateResponse> {
    return this.http
      .post<BaseResponse<DataFormCreateResponse> | DataFormCreateResponse>(this.apiUrl, payload)
      .pipe(map((response) => this.unwrap(response)));
  }

  checkCodeExists(formCode: string): Observable<boolean> {
    return this.http
      .get<BaseResponse<DataFormCodeCheckResponse> | DataFormCodeCheckResponse | boolean>(`${this.apiUrl}/check-code`, {
        params: { formCode }
      })
      .pipe(map((response) => this.toCodeExists(response)));
  }

  private unwrap(response: BaseResponse<DataFormCreateResponse> | DataFormCreateResponse): DataFormCreateResponse {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response;
  }

  private toCodeExists(response: BaseResponse<DataFormCodeCheckResponse> | DataFormCodeCheckResponse | boolean): boolean {
    if (typeof response === 'boolean') {
      return response;
    }

    const body = response && typeof response === 'object' && 'data' in response ? response.data : response;
    if (typeof body === 'boolean') {
      return body;
    }

    return body.exists === true || body.duplicated === true || body.available === false;
  }
}
