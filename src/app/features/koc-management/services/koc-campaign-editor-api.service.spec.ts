import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../enviroment/environment';
import type { CampaignEditorPayload } from '../model/koc-campaign-editor.model';
import { KocCampaignEditorApiService } from './koc-campaign-editor-api.service';

const baseUrl = `${environment.apiUrl.adminAiGenerator}/koc/campaigns`;

function createPayload(overrides: Partial<CampaignEditorPayload> = {}): CampaignEditorPayload {
  return {
    name: 'Spring creator campaign',
    description: 'A focused campaign for product discovery.',
    goal: {
      targetApproved: 12,
      candidateLimit: 18,
    },
    search: {
      instructions: 'Find creators who speak naturally about the product category.',
      scope: {
        platforms: ['instagram', 'tiktok'],
        minFollowers: 1000,
        maxFollowers: 50000,
        locations: ['Thailand'],
        languages: ['th'],
        recentActivityDays: 30,
      },
      requirements: [
        {
          id: 'req-1',
          title: 'Look for creators with genuine product fit',
          description:
            'Prefer people who mention daily use, real routines, and practical reasons to recommend it.',
          importance: 'REQUIRED',
          minimumConfidence: 0.8,
          minimumEvidence: 3,
        },
      ],
    },
    workflow: {
      workflowDefinitionId: 'workflow-def-1',
      workflowVersionId: 'workflow-ver-1',
      workflowVersion: 2,
    },
    ...overrides,
  };
}

describe('KocCampaignEditorApiService', () => {
  let service: KocCampaignEditorApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), KocCampaignEditorApiService],
    });

    service = TestBed.inject(KocCampaignEditorApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a draft through the backend campaign endpoint', async () => {
    const payload = createPayload();

    const pending = firstValueFrom(service.createCampaign(payload));
    const request = httpMock.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ data: response(payload) });

    await expect(pending).resolves.toEqual({
      campaignId: 'campaign-1',
      status: 'DRAFT',
      payload,
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    });
  });

  it('loads an existing campaign from the backend campaign endpoint', async () => {
    const payload = createPayload();

    const pending = firstValueFrom(service.getCampaign('campaign-1'));
    const request = httpMock.expectOne(`${baseUrl}/campaign-1`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: response(payload) });

    await expect(pending).resolves.toMatchObject({
      campaignId: 'campaign-1',
      status: 'DRAFT',
      payload,
    });
  });

  it('updates a draft through the backend campaign endpoint', async () => {
    const payload = createPayload({ name: 'Updated creator campaign' });

    const pending = firstValueFrom(service.updateCampaign('campaign-1', payload));
    const request = httpMock.expectOne(`${baseUrl}/campaign-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ data: response(payload) });

    await expect(pending).resolves.toMatchObject({
      campaignId: 'campaign-1',
      status: 'DRAFT',
      payload,
    });
  });

  it('starts a saved campaign through the backend campaign endpoint', async () => {
    const payload = createPayload();

    const pending = firstValueFrom(service.startCampaign('campaign-1'));
    const request = httpMock.expectOne(`${baseUrl}/campaign-1/start`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ data: response(payload, 'RUNNING') });

    await expect(pending).resolves.toMatchObject({
      campaignId: 'campaign-1',
      status: 'RUNNING',
      payload,
    });
  });

  it('propagates backend errors when loading a missing campaign', async () => {
    const pending = firstValueFrom(service.getCampaign('missing'));
    const request = httpMock.expectOne(`${baseUrl}/missing`);
    request.flush({ errorMessage: 'Campaign not found' }, { status: 404, statusText: 'Not Found' });

    await expect(pending).rejects.toMatchObject({ status: 404 });
  });

  it('maps legacy backend fields when structured campaign fields are absent', async () => {
    const pending = firstValueFrom(service.getCampaign('legacy-1'));
    const request = httpMock.expectOne(`${baseUrl}/legacy-1`);
    request.flush({
      data: {
        campaignId: 'legacy-1',
        name: 'Legacy campaign',
        description: 'Legacy description',
        requirement: 'Legacy requirement',
        status: 'READY',
        acceptedTarget: 10,
        maximumDiscovered: 50,
        maximumScreened: 25,
        workflowDefinitionId: 'wf-def',
        workflowVersionId: 'wf-ver',
      },
    });

    await expect(pending).resolves.toMatchObject({
      campaignId: 'legacy-1',
      status: 'READY',
      payload: {
        name: 'Legacy campaign',
        description: 'Legacy description',
        goal: {
          targetApproved: 10,
          candidateLimit: 50,
        },
        search: {
          instructions: 'Legacy requirement',
          scope: {
            platforms: [],
            locations: [],
            languages: [],
          },
          requirements: [],
        },
        workflow: {
          workflowDefinitionId: 'wf-def',
          workflowVersionId: 'wf-ver',
          workflowVersion: 1,
        },
      },
    });
  });
});

function response(payload: CampaignEditorPayload, status: 'DRAFT' | 'RUNNING' = 'DRAFT') {
  return {
    campaignId: 'campaign-1',
    name: payload.name,
    description: payload.description,
    status,
    acceptedTarget: payload.goal.targetApproved,
    goal: payload.goal,
    search: payload.search,
    workflow: payload.workflow,
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  };
}
