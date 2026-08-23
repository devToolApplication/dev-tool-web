import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type { KocCampaignCounters } from '../model/koc-campaign.model';
import type { KocDependencyHealth } from '../model/koc-dependency.model';
import type { KocIncidentSummary } from '../model/koc-incident.model';

export interface KocDashboardSummary {
  runningCampaigns: number;
  acceptedCandidates: number;
  pendingReviews: number;
  waitingCandidates: number;
  activeIncidents: number;
}

export interface KocDashboardData {
  summary: KocDashboardSummary;
  campaignProgress: KocCampaignCounters[];
  dependencyHealth: KocDependencyHealth[];
  attentionItems: KocIncidentSummary[];
}

@Injectable({ providedIn: 'root' })
export class KocDashboardApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<KocDashboardData> {
    return this.http
      .get<BaseResponse<KocDashboardData>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }
}
