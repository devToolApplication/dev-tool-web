import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../enviroment/environment';
import { BaseResponse } from '../../core/models/base-response.model';
import { DashboardOverview, DashboardTabType } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly endpoints: Record<DashboardTabType, string> = {
    'ai-agent': `${environment.apiUrl.adminAiGenerator}/dashboard/overview`,
    'trade-bot': `${environment.apiUrl.tradeBotAdminUrl}/dashboard/overview`,
    'file-storage': `${environment.apiUrl.adminFileServiceUrl}/dashboard/overview`
  };

  constructor(private readonly http: HttpClient) {}

  getOverview(tab: DashboardTabType): Observable<DashboardOverview> {
    return this.http
      .get<BaseResponse<DashboardOverview>>(this.endpoints[tab])
      .pipe(map((res) => this.normalizeOverview(res.data, tab)));
  }

  private normalizeOverview(data: DashboardOverview | undefined, tab: DashboardTabType): DashboardOverview {
    return {
      service: data?.service ?? tab,
      generatedAt: data?.generatedAt,
      metrics: data?.metrics ?? [],
      charts: data?.charts ?? [],
      activities: data?.activities ?? [],
      resources: data?.resources ?? []
    };
  }
}
