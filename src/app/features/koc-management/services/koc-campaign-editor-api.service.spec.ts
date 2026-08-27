import { firstValueFrom } from 'rxjs';

import type { CampaignEditorPayload } from '../model/koc-campaign-editor.model';
import {
  KocCampaignEditorApiService,
  type CampaignEditorSavedCampaign,
} from './koc-campaign-editor-api.service';

type SavedCampaign = CampaignEditorSavedCampaign;

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
  it('saves a new draft and assigns an id', async () => {
    const service = new KocCampaignEditorApiService();
    const payload = createPayload();

    const saved = await firstValueFrom(service.createCampaign(payload));

    expect(saved).toEqual({
      campaignId: 'campaign-1',
      status: 'DRAFT',
      payload,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('loads a saved draft by id', async () => {
    const service = new KocCampaignEditorApiService();
    const payload = createPayload();

    const created = await firstValueFrom(service.createCampaign(payload)) as SavedCampaign;
    const loaded = await firstValueFrom(service.getCampaign(created.campaignId));

    expect(loaded).toEqual(created);
  });

  it('updates an existing draft', async () => {
    const service = new KocCampaignEditorApiService();
    const created = await firstValueFrom(service.createCampaign(createPayload())) as SavedCampaign;
    const updatedPayload = createPayload({
      name: 'Updated creator campaign',
      description: 'A tighter brief for the same campaign.',
    });

    const updated = await firstValueFrom(service.updateCampaign(created.campaignId, updatedPayload));

    expect(updated).toEqual({
      campaignId: created.campaignId,
      status: 'DRAFT',
      payload: updatedPayload,
      createdAt: created.createdAt,
      updatedAt: expect.any(String),
    });
  });

  it('starts a saved campaign and returns RUNNING status', async () => {
    const service = new KocCampaignEditorApiService();
    const created = await firstValueFrom(service.createCampaign(createPayload())) as SavedCampaign;

    const started = await firstValueFrom(service.startCampaign(created.campaignId));
    const reloaded = await firstValueFrom(service.getCampaign(created.campaignId)) as SavedCampaign;

    expect(started).toEqual({
      campaignId: created.campaignId,
      status: 'RUNNING',
      payload: created.payload,
      createdAt: created.createdAt,
      updatedAt: expect.any(String),
    });
    expect(reloaded.status).toBe('RUNNING');
  });

  it('returns an error when loading a missing campaign', async () => {
    const service = new KocCampaignEditorApiService();

    await expect(firstValueFrom(service.getCampaign('missing'))).rejects.toThrow(
      'Campaign missing was not found',
    );
  });

  it('returns an error when updating or starting a missing campaign', async () => {
    const service = new KocCampaignEditorApiService();

    await expect(firstValueFrom(service.updateCampaign('missing', createPayload()))).rejects.toThrow(
      'Campaign missing was not found',
    );
    await expect(firstValueFrom(service.startCampaign('missing'))).rejects.toThrow(
      'Campaign missing was not found',
    );
  });

  it('does not accept reviewedBy or reviewedAt fields on save payload', async () => {
    const service = new KocCampaignEditorApiService();
    const payloadWithExtras = {
      ...createPayload(),
      reviewedBy: 'alice',
      reviewedAt: '2026-08-27T00:00:00.000Z',
    } as CampaignEditorPayload & {
      reviewedBy: string;
      reviewedAt: string;
    };

    const saved = await firstValueFrom(
      service.createCampaign(payloadWithExtras as CampaignEditorPayload),
    ) as SavedCampaign;

    expect(saved.payload).not.toHaveProperty('reviewedBy');
    expect(saved.payload).not.toHaveProperty('reviewedAt');
  });
});
