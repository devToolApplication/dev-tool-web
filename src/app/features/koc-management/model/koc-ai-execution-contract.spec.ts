import type { KocAiExecutionConfig, KocProvider } from './koc-common.model';
import type { KocCampaignUpsertPayload } from './koc-campaign.model';

type ForbiddenKocRuntimeField =
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

  it('does not expose physical runtime fields on campaign upsert payloads', () => {
    const forbiddenFields: ForbiddenKocRuntimeField[] = [
      'model',
      'modelProfile',
      'reasoningEffort',
      'mcpConfig',
      'toolProfile',
      'skills',
      'systemPrompt',
      'runtimeHome',
    ];
    const payloadKeys = Object.keys({
      name: 'Autumn KOC discovery',
      code: 'AUTUMN-KOC',
      targetAccepted: 100,
      maximumDiscovered: 300,
      maximumScreened: 200,
      discoveryExecution: { agentCode: 'facebook-candidate-discovery', provider: 'claude' },
      screeningExecution: { agentCode: 'koc-screening', provider: 'codex' },
    } satisfies KocCampaignUpsertPayload);

    expect(payloadKeys.some((key) => forbiddenFields.includes(key as ForbiddenKocRuntimeField))).toBe(
      false,
    );
  });
});
