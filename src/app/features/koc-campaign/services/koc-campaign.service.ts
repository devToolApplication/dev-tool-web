import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BasePageResponse, BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import {
  KocCampaignCloneRequest,
  KocCampaignCreateRequest,
  KocCampaignItem,
  KocCampaignQueryParams,
  KocCampaignUpdateRequest,
  KocCandidateApprovalItem,
  KocCandidateItem,
} from '../models/koc-campaign.model';
import { WorkflowTask } from '../../workflow-studio/model/workflow-studio.model';

@Injectable({
  providedIn: 'root',
})
export class KocCampaignService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc-campaigns`;
  private readonly workflowTasksUrl = `${environment.apiUrl.adminAiGenerator}/workflows/tasks`;

  constructor(private readonly http: HttpClient) {}

  getCampaignPage(params: KocCampaignQueryParams): Observable<BasePageResponse<KocCampaignItem>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params.niche) httpParams = httpParams.set('niche', params.niche);
    if (params.workflowStatus) httpParams = httpParams.set('workflowStatus', params.workflowStatus);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);

    return this.http
      .get<BaseResponse<BasePageResponse<KocCampaignItem>>>(`${this.baseUrl}/page`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getCampaignById(id: string): Observable<KocCampaignItem> {
    return this.http
      .get<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  getCampaignCandidates(id: string): Observable<KocCandidateItem[]> {
    return this.http
      .get<BaseResponse<KocCandidateItem[]>>(`${this.baseUrl}/${id}/candidates`)
      .pipe(map((res) => res.data || []));
  }

  createAndStartCampaign(req: KocCampaignCreateRequest): Observable<KocCampaignItem> {
    return this.http
      .post<BaseResponse<KocCampaignItem>>(this.baseUrl, req)
      .pipe(map((res) => res.data));
  }

  cloneCampaign(id: string, req?: KocCampaignCloneRequest): Observable<KocCampaignItem> {
    return this.http
      .post<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}/clone`, req ?? {})
      .pipe(map((res) => res.data));
  }

  updateCampaign(id: string, req: KocCampaignUpdateRequest): Observable<KocCampaignItem> {
    return this.http
      .put<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`, req)
      .pipe(map((res) => res.data));
  }

  deleteCampaign(id: string): Observable<KocCampaignItem> {
    return this.http
      .delete<BaseResponse<KocCampaignItem>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  getPendingApprovalTasks(
    page = 0,
    size = 50,
    campaignId?: string,
    taskDefinitionKey?: string
  ): Observable<BasePageResponse<WorkflowTask>> {
    let httpParams = new HttpParams().set('page', page).set('size', size);
    if (campaignId) httpParams = httpParams.set('campaignId', campaignId);
    if (taskDefinitionKey) httpParams = httpParams.set('taskDefinitionKey', taskDefinitionKey);
    return this.http
      .get<BaseResponse<BasePageResponse<WorkflowTask>>>(`${this.workflowTasksUrl}/page`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getTaskVariables(taskId: string): Observable<Record<string, unknown>> {
    return this.http
      .get<BaseResponse<Record<string, unknown>>>(`${this.workflowTasksUrl}/${taskId}/variables`)
      .pipe(map((res) => res.data || {}));
  }

  claimTask(taskId: string, assignee: string): Observable<boolean> {
    return this.http
      .post<BaseResponse<boolean>>(`${this.workflowTasksUrl}/${taskId}/claim`, { assignee })
      .pipe(map((res) => res.data));
  }

  unclaimTask(taskId: string): Observable<boolean> {
    return this.http
      .post<BaseResponse<boolean>>(`${this.workflowTasksUrl}/${taskId}/unclaim`, {})
      .pipe(map((res) => res.data));
  }

  completeApprovalTask(
    taskId: string,
    approvedCandidates: KocCandidateApprovalItem[],
    approved: boolean
  ): Observable<boolean> {
    const payload = {
      variables: {
        approved,
        approvedCandidates,
      },
    };
    return this.http
      .post<BaseResponse<boolean>>(`${this.workflowTasksUrl}/${taskId}/complete`, payload)
      .pipe(map((res) => res.data));
  }

  completeDiscoveryDecisionTask(
    taskId: string,
    decision: 'FIND_MORE' | 'STOP'
  ): Observable<boolean> {
    const payload = {
      variables: {
        discoveryDecision: decision,
      },
    };
    return this.http
      .post<BaseResponse<boolean>>(`${this.workflowTasksUrl}/${taskId}/complete`, payload)
      .pipe(map((res) => res.data));
  }

  completeManual2faTask(taskId: string): Observable<boolean> {
    const payload = {
      variables: {
        manualApproved: true,
      },
    };
    return this.http
      .post<BaseResponse<boolean>>(`${this.workflowTasksUrl}/${taskId}/complete`, payload)
      .pipe(map((res) => res.data));
  }
}
