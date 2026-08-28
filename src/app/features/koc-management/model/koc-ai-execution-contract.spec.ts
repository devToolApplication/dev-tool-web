import type { KocAiExecutionConfig, KocProvider } from './koc-common.model';
import type { KocCampaignUpsertPayload } from './koc-campaign.model';

type ForbiddenKocPayloadField =
  | 'code'
  | 'targetAccepted'
  | 'maximumDiscovered'
  | 'maximumScreened'
  | 'discoveryExecution'
  | 'screeningExecution'
  | 'discoverySignals'
  | 'searchStrategies'
  | 'screeningRules'
  | 'model'
  | 'modelProfile'
  | 'reasoningEffort'
  | 'mcpConfig'
  | 'toolProfile'
  | 'skills'
  | 'systemPrompt'
  | 'runtimeHome';

describe('KOC AI execution contract', () => {
  it('uses agentCode plus optional provider as the execution selection boundary', () => {
    const provider: KocProvider = 'codex';
    const config: KocAiExecutionConfig = {
      agentCode: 'facebook-candidate-discovery',
      provider,
    };

    expect(config).toEqual({
      agentCode: 'facebook-candidate-discovery',
      provider: 'codex',
    });
  });

  it('sends only strict upsert fields and omits legacy runtime and search fields', () => {
    const forbiddenFields: ForbiddenKocPayloadField[] = [
      'code',
      'targetAccepted',
      'maximumDiscovered',
      'maximumScreened',
      'discoveryExecution',
      'screeningExecution',
      'discoverySignals',
      'searchStrategies',
      'screeningRules',
      'model',
      'modelProfile',
      'reasoningEffort',
      'mcpConfig',
      'toolProfile',
      'skills',
      'systemPrompt',
      'runtimeHome',
    ];

    const validPayload: KocCampaignUpsertPayload = {
      name: 'Autumn KOC discovery',
      description: 'Find creators across target channels',
      goal: {
        targetApproved: 10,
        candidateLimit: 50,
      },
      search: {
        instructions: 'Search active creators with high engagement in lifestyle',
        scope: {
          platforms: ['tiktok', 'instagram'],
          minFollowers: 5000,
          maxFollowers: 100000,
          locations: ['Vietnam', 'Thailand'],
          languages: ['vi', 'th'],
          recentActivityDays: 30,
        },
        requirements: [
          {
            id: 'req-1',
            title: 'Authentic engagement',
            description: 'Creator regularly interacts with followers in comments',
            importance: 'REQUIRED',
            minimumConfidence: 0.8,
            minimumEvidence: 3,
          },
        ],
      },
      workflow: {
        workflowDefinitionId: 'koc-search-evaluation',
        workflowVersionId: 'koc-search-evaluation-v1',
        workflowVersion: 1,
      },
    };

    const payloadKeys = Object.keys(validPayload);
    expect(payloadKeys.sort()).toEqual(['description', 'goal', 'name', 'search', 'workflow']);
    expect(payloadKeys.some((key) => forbiddenFields.includes(key as ForbiddenKocPayloadField))).toBe(
      false,
    );

    const goalKeys = Object.keys(validPayload.goal);
    expect(goalKeys.sort()).toEqual(['candidateLimit', 'targetApproved']);

    const searchKeys = Object.keys(validPayload.search);
    expect(searchKeys.sort()).toEqual(['instructions', 'requirements', 'scope']);

    const scopeKeys = Object.keys(validPayload.search.scope ?? {});
    expect(scopeKeys.sort()).toEqual([
      'languages',
      'locations',
      'maxFollowers',
      'minFollowers',
      'platforms',
      'recentActivityDays',
    ]);

    const requirementKeys = Object.keys(validPayload.search.requirements?.[0] ?? {});
    expect(requirementKeys.sort()).toEqual([
      'description',
      'id',
      'importance',
      'minimumConfidence',
      'minimumEvidence',
      'title',
    ]);

    const workflowKeys = Object.keys(validPayload.workflow);
    expect(workflowKeys.sort()).toEqual([
      'workflowDefinitionId',
      'workflowVersion',
      'workflowVersionId',
    ]);
  });
});