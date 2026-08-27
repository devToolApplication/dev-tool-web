import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import type { CampaignEditorPayload } from '../model/koc-campaign-editor.model';

export interface CampaignEditorSavedCampaign {
  campaignId: string;
  status: 'DRAFT' | 'RUNNING';
  payload: CampaignEditorPayload;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class KocCampaignEditorApiService {
  // ponytail: in-memory FE-first contract; replace the method bodies with HTTP calls when backend endpoints are ready.
  private readonly campaigns = new Map<string, CampaignEditorSavedCampaign>();
  private nextCampaignNumber = 1;

  getCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign> {
    const saved = this.campaigns.get(campaignId);
    return saved ? of(cloneSavedCampaign(saved)) : missingCampaign(campaignId);
  }

  createCampaign(payload: CampaignEditorPayload): Observable<CampaignEditorSavedCampaign> {
    const now = new Date().toISOString();
    const saved: CampaignEditorSavedCampaign = {
      campaignId: `campaign-${this.nextCampaignNumber++}`,
      status: 'DRAFT',
      payload: sanitizePayload(payload),
      createdAt: now,
      updatedAt: now,
    };
    this.campaigns.set(saved.campaignId, saved);
    return of(cloneSavedCampaign(saved));
  }

  updateCampaign(
    campaignId: string,
    payload: CampaignEditorPayload,
  ): Observable<CampaignEditorSavedCampaign> {
    const current = this.campaigns.get(campaignId);
    if (!current) {
      return missingCampaign(campaignId);
    }

    const saved: CampaignEditorSavedCampaign = {
      ...current,
      status: 'DRAFT',
      payload: sanitizePayload(payload),
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(campaignId, saved);
    return of(cloneSavedCampaign(saved));
  }

  startCampaign(campaignId: string): Observable<CampaignEditorSavedCampaign> {
    const current = this.campaigns.get(campaignId);
    if (!current) {
      return missingCampaign(campaignId);
    }

    const saved: CampaignEditorSavedCampaign = {
      ...current,
      status: 'RUNNING',
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(campaignId, saved);
    return of(cloneSavedCampaign(saved));
  }
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

function cloneSavedCampaign(saved: CampaignEditorSavedCampaign): CampaignEditorSavedCampaign {
  return {
    ...saved,
    payload: sanitizePayload(saved.payload),
  };
}

function missingCampaign(campaignId: string): Observable<never> {
  return throwError(() => new Error(`Campaign ${campaignId} was not found`));
}
