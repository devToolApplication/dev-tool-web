import type { KocCampaignWizardDraft } from './koc-campaign-wizard.model';
import {
  KOC_CAMPAIGN_WIZARD_STEPS,
  createDefaultAiScreeningRule,
  createDefaultCodeScreeningRule,
  createDefaultCampaignWizardDraft,
  toKocCampaignUpsertPayload,
  validateCampaignWizardDraft,
} from './koc-campaign-wizard.model';

const forbiddenRuntimeFields = [
  'model',
  'modelProfile',
  'reasoningEffort',
  'mcpConfig',
  'toolProfile',
  'skills',
  'systemPrompt',
  'runtimeHome',
];

function validDraft(overrides: Partial<KocCampaignWizardDraft> = {}): KocCampaignWizardDraft {
  return {
    ...createDefaultCampaignWizardDraft(),
    name: 'Back to school',
    code: 'BTS-2026',
    description: 'KOC campaign',
    targetAccepted: 10,
    maximumDiscovered: 100,
    maximumScreened: 50,
    discoveryExecution: { agentCode: 'facebook-discovery', provider: 'codex' },
    discoverySignals: [
      { key: 'profile', label: 'koc.discovery.signal.profile', enabled: true, weight: 60 },
    ],
    searchStrategies: [
      {
        name: 'Parent groups',
        enabled: true,
        priority: 1,
        keywords: ['school', 'parent'],
        maxQueries: 5,
        maxCandidates: 20,
      },
    ],
    screeningRules: [createDefaultCodeScreeningRule('HARD_FILTERS', 1)],
    ...overrides,
  };
}

describe('KOC campaign wizard model', () => {
  it('defines the Phase 3 wizard steps in order', () => {
    expect(KOC_CAMPAIGN_WIZARD_STEPS.map((step) => step.id)).toEqual([
      'general',
      'discovery',
      'screening',
      'review',
    ]);
  });

  it('validates general targets, discovery execution and strategy requirements', () => {
    const issues = validateCampaignWizardDraft({
      ...createDefaultCampaignWizardDraft(),
      name: '',
      code: '',
      targetAccepted: 0,
      maximumDiscovered: 0,
      maximumScreened: 0,
      discoveryExecution: { agentCode: '' },
      searchStrategies: [],
    });

    expect(issues.map((issue) => issue.key)).toEqual(expect.arrayContaining([
      'koc.campaignWizard.validation.nameRequired',
      'koc.campaignWizard.validation.codeRequired',
      'koc.campaignWizard.validation.targetAcceptedPositive',
      'koc.campaignWizard.validation.maximumDiscoveredGteTarget',
      'koc.campaignWizard.validation.maximumScreenedGteTarget',
      'koc.campaignWizard.validation.discoveryAgentRequired',
      'koc.campaignWizard.validation.strategyRequired',
    ]));
  });

  it('validates Phase 4 screening rule guardrails', () => {
    const issues = validateCampaignWizardDraft(validDraft({
      screeningRules: [
        {
          ...createDefaultAiScreeningRule('QUALIFICATION', 1),
          execution: { agentCode: '' },
          whenEvidenceMissing: 'REJECT_WITH_POLICY',
        },
      ],
    }));

    expect(issues.map((issue) => issue.key)).toEqual(expect.arrayContaining([
      'koc.campaignWizard.validation.screeningAiAgentRequired',
      'koc.campaignWizard.validation.missingEvidenceCannotReject',
    ]));
  });

  it('builds a typed payload without physical runtime configuration', () => {
    const payload = toKocCampaignUpsertPayload(validDraft({
      screeningRules: [
        createDefaultCodeScreeningRule('HARD_FILTERS', 1),
        {
          ...createDefaultAiScreeningRule('ENGAGEMENT', 2),
          execution: { agentCode: 'engagement-research', provider: 'claude' },
        },
      ],
    }));
    const payloadText = JSON.stringify(payload);

    expect(payload).toEqual(expect.objectContaining({
      name: 'Back to school',
      code: 'BTS-2026',
      targetAccepted: 10,
      maximumDiscovered: 100,
      maximumScreened: 50,
      discoveryExecution: { agentCode: 'facebook-discovery', provider: 'codex' },
      discoverySignals: expect.any(Array),
      searchStrategies: expect.any(Array),
      screeningRules: [
        expect.objectContaining({ kind: 'CODE', whenEvidenceMissing: 'CONTINUE' }),
        expect.objectContaining({
          kind: 'AI',
          execution: { agentCode: 'engagement-research', provider: 'claude' },
          whenEvidenceMissing: 'CONTINUE',
        }),
      ],
    }));
    expect(forbiddenRuntimeFields.some((field) => payloadText.includes(`"${field}"`))).toBe(false);
  });
});
