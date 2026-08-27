import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type { CampaignEditorPayload } from '../model/koc-campaign-editor.model';
import type { KocCampaignStatus } from '../model/koc-campaign.model';

export interface CampaignEditorSavedCampaign {
  campaignId: string;
  status: KocCampaignStatus;
  payload: CampaignEditorPayload;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class KocCampaignEditorApiService {
  private readonly baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/campaigns`;

  constructor(private readonly http: HttpClient) {}

  getCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign> {
    return this.http
      .get<BaseResponse<KocCampaignEditorResponse>>(`${this.baseUrl}/${campaignId}`)
      .pipe(map((response) => toSavedCampaign(response.data)));
  }

  createCampaign(payload: CampaignEditorPayload): Observable<CampaignEditorSavedCampaign> {
    return this.http
      .post<BaseResponse<KocCampaignEditorResponse>>(this.baseUrl, sanitizePayload(payload))
      .pipe(map((response) => toSavedCampaign(response.data)));
  }

  updateCampaign(
    campaignId: string,
    payload: CampaignEditorPayload,
  ): Observable<CampaignEditorSavedCampaign> {
    return this.http
      .put<BaseResponse<KocCampaignEditorResponse>>(
        `${this.baseUrl}/${campaignId}`,
        sanitizePayload(payload),
      )
      .pipe(map((response) => toSavedCampaign(response.data)));
  }

  startCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign> {
    return this.http
      .post<BaseResponse<KocCampaignEditorResponse>>(`${this.baseUrl}/${campaignId}/start`, null)
      .pipe(map((response) => toSavedCampaign(response.data)));
  }
}

interface KocCampaignEditorResponse {
  campaignId: string;
  name: string;
  description?: string | null;
  requirement?: string | null;
  status: KocCampaignStatus;
  acceptedTarget?: number | null;
  maximumDiscovered?: number | null;
  maximumScreened?: number | null;
  goal?: CampaignEditorPayload['goal'] | null;
  search?: {
    instructions?: string | null;
    scope?: CampaignEditorPayload['search']['scope'] | null;
    requirements?: CampaignEditorPayload['search']['requirements'] | null;
  } | null;
  workflow?: {
    workflowDefinitionId?: string | null;
    workflowVersionId?: string | null;
    workflowVersion?: number | null;
  } | null;
  workflowDefinitionId?: string | null;
  workflowVersionId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function sanitizePayload(payload: CampaignEditorPayload): CampaignEditorPayload {
  return {
    name: payload.name,
    ...(payload.description ? { description: payload.description } : {}),
    goal: { ...payload.goal },
    search: {
      ...(payload.search.instructions ? { instructions: payload.search.instructions } : {}),
      scope: {
        ...payload.search.scope,
        platforms: [...(payload.search.scope.platforms ?? [])],
        locations: [...(payload.search.scope.locations ?? [])],
        languages: [...(payload.search.scope.languages ?? [])],
      },
      requirements: payload.search.requirements.map((requirement) => ({ ...requirement })),
    },
    workflow: { ...payload.workflow },
  };
}

function toSavedCampaign(campaign: KocCampaignEditorResponse): CampaignEditorSavedCampaign {
  return {
    campaignId: campaign.campaignId,
    status: campaign.status,
    payload: toPayload(campaign),
    createdAt: campaign.createdAt ?? '',
    updatedAt: campaign.updatedAt ?? campaign.createdAt ?? '',
  };
}

function toPayload(campaign: KocCampaignEditorResponse): CampaignEditorPayload {
  const search = campaign.search;
  const workflow = campaign.workflow;

  return sanitizePayload({
    name: campaign.name,
    ...(campaign.description ? { description: campaign.description } : {}),
    goal: campaign.goal ?? {
      targetApproved: campaign.acceptedTarget ?? 0,
      candidateLimit: campaign.maximumDiscovered ?? campaign.maximumScreened ?? campaign.acceptedTarget ?? 0,
    },
    search: {
      instructions: search?.instructions ?? campaign.requirement ?? campaign.description ?? '',
      scope: search?.scope ?? {},
      requirements: search?.requirements ?? [],
    },
    workflow: {
      workflowDefinitionId: workflow?.workflowDefinitionId ?? campaign.workflowDefinitionId ?? '',
      workflowVersionId: workflow?.workflowVersionId ?? campaign.workflowVersionId ?? '',
      workflowVersion: workflow?.workflowVersion ?? 1,
    },
  });
}
