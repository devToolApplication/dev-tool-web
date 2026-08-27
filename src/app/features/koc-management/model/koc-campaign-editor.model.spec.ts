import type { CampaignEditorDraft, CampaignEditorStepId, CampaignRequirement } from './koc-campaign-editor.model';
import {
  createCampaignRequirement,
  createDefaultCampaignEditorDraft,
  toCampaignEditorPayload,
  validateCampaignEditorDraft,
} from './koc-campaign-editor.model';

function readyDraft(overrides: Partial<CampaignEditorDraft> = {}): CampaignEditorDraft {
  return {
    ...createDefaultCampaignEditorDraft(),
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
        createCampaignRequirement({
          id: 'req-1',
          title: 'Look for creators with genuine product fit',
          description: 'Prefer people who mention daily use, real routines, and practical reasons to recommend it.',
          importance: 'REQUIRED',
          minimumConfidence: 0.8,
          minimumEvidence: 3,
        }),
      ],
    },
    workflow: {
      workflowDefinitionId: 'workflow-def-1',
      workflowVersionId: 'workflow-ver-1',
      workflowVersion: 2,
      workflowName: 'Campaign review flow',
    },
    ...overrides,
  };
}

describe('campaign editor model', () => {
  it('creates a three-step draft without legacy execution fields', () => {
    const steps: CampaignEditorStepId[] = ['campaign', 'searchRequirements', 'reviewStart'];
    const draft = createDefaultCampaignEditorDraft();

    expect(steps).toEqual(['campaign', 'searchRequirements', 'reviewStart']);
    expect(draft).toEqual(expect.objectContaining({
      name: '',
      description: '',
      goal: {
        targetApproved: expect.any(Number),
        candidateLimit: expect.any(Number),
      },
      search: expect.objectContaining({
        instructions: '',
        scope: {
          platforms: [],
          minFollowers: null,
          maxFollowers: null,
          locations: [],
          languages: [],
          recentActivityDays: null,
        },
        requirements: [],
      }),
      workflow: {
        workflowDefinitionId: 'koc-search-evaluation',
        workflowVersionId: 'koc-search-evaluation-v1',
        workflowVersion: 1,
        workflowName: 'KOC Search & Evaluation',
      },
    }));
    expect(draft).not.toHaveProperty('code');
    expect(draft.workflow).not.toHaveProperty('agentCode');
    expect(draft.workflow).not.toHaveProperty('provider');
  });

  it('validates campaign goal fields', () => {
    const issues = validateCampaignEditorDraft(readyDraft({
      goal: {
        targetApproved: 0,
        candidateLimit: 4,
      },
    }));

    expect(issues).toEqual([
      {
        path: 'goal.targetApproved',
        key: 'koc.campaignEditor.validation.targetApprovedPositive',
      },
    ]);
  });

  it('validates candidate limit against the approved target', () => {
    const issues = validateCampaignEditorDraft(readyDraft({
      goal: {
        targetApproved: 6,
        candidateLimit: 5,
      },
    }));

    expect(issues).toEqual([
      {
        path: 'goal.candidateLimit',
        key: 'koc.campaignEditor.validation.candidateLimitGteTargetApproved',
      },
    ]);
  });

  it('requires a campaign name', () => {
    const issues = validateCampaignEditorDraft(readyDraft({ name: '' }));

    expect(issues).toContainEqual({
      path: 'name',
      key: 'koc.campaignEditor.validation.nameRequired',
    });
  });

  it('requires at least one requirement and workflow references before start', () => {
    const issues = validateCampaignEditorDraft(readyDraft({
      search: {
        ...createDefaultCampaignEditorDraft().search,
        requirements: [],
      },
      workflow: {
        workflowDefinitionId: '',
        workflowVersionId: '',
        workflowVersion: null,
      workflowName: '',
      },
    }));

    expect(issues).toEqual(expect.arrayContaining([
      {
        path: 'search.instructions',
        key: 'koc.campaignEditor.validation.instructionsRequired',
      },
      {
        path: 'search.requirements',
        key: 'koc.campaignEditor.validation.requirementsRequired',
      },
      {
        path: 'workflow.workflowDefinitionId',
        key: 'koc.campaignEditor.validation.workflowDefinitionRequired',
      },
      {
        path: 'workflow.workflowVersionId',
        key: 'koc.campaignEditor.validation.workflowVersionRequired',
      },
      {
        path: 'workflow.workflowVersion',
        key: 'koc.campaignEditor.validation.workflowVersionNumberRequired',
      },
    ]));
    expect(issues).toHaveLength(5);
  });

  it('preserves arbitrary natural-language requirement content', () => {
    const requirement: CampaignRequirement = createCampaignRequirement({
      id: 'req-44',
      title: 'Creators who sound like real customers, not polished spokespeople',
      description: 'Prefer clear, conversational notes about everyday usage, product fit, and why the person would actually recommend it.',
      importance: 'PREFERRED',
      minimumConfidence: 0.45,
      minimumEvidence: 1,
    });

    const payload = toCampaignEditorPayload(readyDraft({
      search: {
        ...readyDraft().search,
        requirements: [requirement],
      },
    }));

    expect(payload.search.requirements[0]).toEqual(requirement);
  });

  it('keeps requirement ids stable when requirement text changes', () => {
    const original = createCampaignRequirement({
      id: 'req-99',
      title: 'Original wording',
      description: 'Original description.',
    });
    const updated = createCampaignRequirement({
      ...original,
      title: 'Updated wording',
      description: 'Updated description with different natural language.',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe('Updated wording');
    expect(updated.description).toBe('Updated description with different natural language.');
  });

  it('creates distinct requirement ids by default', () => {
    const first = createCampaignRequirement();
    const second = createCampaignRequirement();

    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(second.id).not.toBe(first.id);
  });

  it('maps a draft to a payload without agent provider or rule fields', () => {
    const payload = toCampaignEditorPayload(readyDraft());

    expect(payload).toEqual({
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
          expect.objectContaining({
            id: 'req-1',
            title: 'Look for creators with genuine product fit',
            description: 'Prefer people who mention daily use, real routines, and practical reasons to recommend it.',
            importance: 'REQUIRED',
            minimumConfidence: 0.8,
            minimumEvidence: 3,
          }),
        ],
      },
      workflow: {
        workflowDefinitionId: 'workflow-def-1',
        workflowVersionId: 'workflow-ver-1',
        workflowVersion: 2,
      },
    });
    expect(payload).not.toHaveProperty('code');
    expect(payload.workflow).not.toHaveProperty('workflowName');
    expect(JSON.stringify(payload.search)).not.toContain('agentCode');
    expect(JSON.stringify(payload.search)).not.toContain('provider');
  });

  it('does not serialize a draft without a workflow version number', () => {
    expect(() =>
      toCampaignEditorPayload(readyDraft({
        workflow: {
          workflowDefinitionId: 'workflow-def-1',
          workflowVersionId: 'workflow-ver-1',
          workflowVersion: null,
          workflowName: 'Campaign review flow',
        },
      })),
    ).toThrow('workflowVersion is required before serialization');
  });

  it('requires a positive workflow version number before start', () => {
    const issues = validateCampaignEditorDraft(readyDraft({
      workflow: {
        workflowDefinitionId: 'workflow-def-1',
        workflowVersionId: 'workflow-ver-1',
        workflowVersion: 0,
        workflowName: 'Campaign review flow',
      },
    }));

    expect(issues).toContainEqual({
      path: 'workflow.workflowVersion',
      key: 'koc.campaignEditor.validation.workflowVersionNumberRequired',
    });
  });
});
