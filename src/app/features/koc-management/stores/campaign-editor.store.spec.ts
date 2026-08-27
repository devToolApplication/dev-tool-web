import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';

import {
  createCampaignRequirement,
  createDefaultCampaignEditorDraft,
  toCampaignEditorPayload,
  type CampaignEditorDraft,
} from '../model/koc-campaign-editor.model';
import {
  KocCampaignEditorApiService,
  type CampaignEditorSavedCampaign,
} from '../services/koc-campaign-editor-api.service';
import { CampaignEditorStore } from './campaign-editor.store';

function createValidDraft(): CampaignEditorDraft {
  return {
    name: 'Spring creator campaign',
    description: 'A focused campaign for creator search',
    goal: {
      targetApproved: 10,
      candidateLimit: 25,
    },
    search: {
      instructions: 'Target active lifestyle and tech reviewers in Southeast Asia.',
      scope: {
        platforms: ['instagram', 'tiktok'],
        minFollowers: 5000,
        maxFollowers: 100000,
        locations: ['Vietnam', 'Thailand'],
        languages: ['vi', 'th'],
        recentActivityDays: 30,
      },
      requirements: [
        createCampaignRequirement({
          id: 'req-1',
          title: 'Direct product fit',
          description: 'Creators must demonstrate real lifestyle usage.',
          importance: 'REQUIRED',
          minimumConfidence: 0.8,
          minimumEvidence: 2,
        }),
      ],
    },
    workflow: {
      workflowDefinitionId: 'wf-def-1',
      workflowVersionId: 'wf-ver-1',
      workflowVersion: 1,
      workflowName: 'Default Review Pipeline',
    },
  };
}

describe('CampaignEditorStore', () => {
  let store: CampaignEditorStore;
  let apiService: KocCampaignEditorApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CampaignEditorStore, KocCampaignEditorApiService],
    });
    store = TestBed.inject(CampaignEditorStore);
    apiService = TestBed.inject(KocCampaignEditorApiService);
  });

  it('initializes create mode with a clean default draft', () => {
    store.initialize();

    expect(store.draft()).toEqual(createDefaultCampaignEditorDraft());
    expect(store.activeStepId()).toBe('campaign');
    expect(store.dirty()).toBe(false);
    expect(store.savedCampaignId()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.saving()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.canGoBack()).toBe(false);
    expect(store.canContinue()).toBe(true);
    expect(store.hasUnsavedChanges()).toBe(false);
  });

  it('updates goal and marks the draft dirty', () => {
    store.initialize();

    store.updateGoal({ targetApproved: 15, candidateLimit: 30 });

    expect(store.draft().goal).toEqual({
      targetApproved: 15,
      candidateLimit: 30,
    });
    expect(store.dirty()).toBe(true);
    expect(store.hasUnsavedChanges()).toBe(true);
  });

  it('adds edits and removes a natural-language requirement', () => {
    store.initialize();
    expect(store.draft().search.requirements).toHaveLength(0);

    store.addRequirement();
    expect(store.draft().search.requirements).toHaveLength(1);

    const added = store.draft().search.requirements[0];
    expect(added.id).toBeTruthy();
    expect(added.importance).toBe('REQUIRED');

    store.updateRequirement(added.id, {
      title: 'Real unboxing experience',
      description: 'Must show unboxing process without script reading.',
      importance: 'PREFERRED',
      minimumConfidence: 0.75,
      minimumEvidence: 1,
    });

    const updated = store.draft().search.requirements[0];
    expect(updated.id).toBe(added.id);
    expect(updated.title).toBe('Real unboxing experience');
    expect(updated.description).toBe('Must show unboxing process without script reading.');
    expect(updated.importance).toBe('PREFERRED');
    expect(updated.minimumConfidence).toBe(0.75);
    expect(updated.minimumEvidence).toBe(1);

    store.removeRequirement(added.id);
    expect(store.draft().search.requirements).toHaveLength(0);
    expect(store.dirty()).toBe(true);
  });

  it('blocks save when validation fails', async () => {
    store.initialize();

    const result = await store.saveDraft();

    expect(result).toBeNull();
    expect(store.validationIssues().length).toBeGreaterThan(0);
    expect(store.issueFor('name')).toBe('koc.campaignEditor.validation.nameRequired');
    expect(store.issueFor('search.requirements')).toBe(
      'koc.campaignEditor.validation.requirementsRequired',
    );
    expect(store.savedCampaignId()).toBeNull();
  });

  it('saves a valid draft and clears dirty state', async () => {
    store.initialize();
    store.updateDraft(createValidDraft());
    expect(store.dirty()).toBe(true);

    const saved = await store.saveDraft();

    expect(saved).not.toBeNull();
    expect(saved?.campaignId).toMatch(/^campaign-/);
    expect(saved?.status).toBe('DRAFT');
    expect(store.savedCampaignId()).toBe(saved?.campaignId ?? null);
    expect(store.dirty()).toBe(false);
    expect(store.validationIssues()).toEqual([]);
    expect(store.hasUnsavedChanges()).toBe(false);
  });

  it('starts a valid campaign and returns the campaign id', async () => {
    store.initialize();
    store.updateDraft(createValidDraft());

    const started = await store.startCampaign();

    expect(started).not.toBeNull();
    expect(started?.campaignId).toMatch(/^campaign-/);
    expect(started?.status).toBe('RUNNING');
    expect(store.savedCampaignId()).toBe(started?.campaignId ?? null);
    expect(store.dirty()).toBe(false);
    expect(store.saving()).toBe(false);
  });

  it('loads an existing campaign when initialized with a campaignId', async () => {
    const validDraft = createValidDraft();
    const existing = await firstValueFrom(
      apiService.createCampaign({
        name: validDraft.name,
        description: validDraft.description,
        goal: validDraft.goal,
        search: validDraft.search,
        workflow: {
          workflowDefinitionId: validDraft.workflow.workflowDefinitionId,
          workflowVersionId: validDraft.workflow.workflowVersionId,
          workflowVersion: validDraft.workflow.workflowVersion!,
        },
      }),
    );

    store.initialize(existing.campaignId);
    await Promise.resolve();

    expect(store.savedCampaignId()).toBe(existing.campaignId);
    expect(store.draft().name).toBe(validDraft.name);
    expect(store.draft().workflow.workflowDefinitionId).toBe(validDraft.workflow.workflowDefinitionId);
    expect(store.dirty()).toBe(false);
  });

  it('keeps a newer initialize call when an older load resolves later', async () => {
    const subject = new Subject<CampaignEditorSavedCampaign>();
    const campaign = {
      campaignId: 'campaign-old',
      status: 'DRAFT' as const,
      payload: toCampaignEditorPayload(createValidDraft()),
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    };

    vi.spyOn(apiService, 'getCampaign').mockReturnValue(subject.asObservable());

    store.initialize('campaign-old');
    store.initialize();

    subject.next(campaign);
    await Promise.resolve();

    expect(store.draft()).toEqual(createDefaultCampaignEditorDraft());
    expect(store.savedCampaignId()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('captures load failures when initializing with a missing campaignId', async () => {
    store.initialize('missing');
    await Promise.resolve();

    expect(store.error()).toBe('Campaign missing was not found');
    expect(store.loading()).toBe(false);
  });

  it('handles step transitions forward and backward', () => {
    store.initialize();
    expect(store.activeStepId()).toBe('campaign');
    expect(store.canGoBack()).toBe(false);
    expect(store.canContinue()).toBe(true);

    store.continue();
    expect(store.activeStepId()).toBe('searchRequirements');
    expect(store.canGoBack()).toBe(true);
    expect(store.canContinue()).toBe(true);

    store.continue();
    expect(store.activeStepId()).toBe('reviewStart');
    expect(store.canGoBack()).toBe(true);
    expect(store.canContinue()).toBe(false);

    store.back();
    expect(store.activeStepId()).toBe('searchRequirements');

    store.setStep('campaign');
    expect(store.activeStepId()).toBe('campaign');
  });

  it('updates search scope and instructions', () => {
    store.initialize();

    store.updateInstructions('New custom instructions');
    store.updateScope({
      platforms: ['youtube'],
      minFollowers: 2000,
    });

    expect(store.draft().search.instructions).toBe('New custom instructions');
    expect(store.draft().search.scope.platforms).toEqual(['youtube']);
    expect(store.draft().search.scope.minFollowers).toBe(2000);
    expect(store.dirty()).toBe(true);
  });
});
