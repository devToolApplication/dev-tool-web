import type { KocCampaignDetail, KocCampaignUpsertPayload } from './koc-campaign.model';
import type { KocAiExecutionConfig } from './koc-common.model';
import type { KocDiscoverySignal, KocSearchStrategy } from './koc-discovery.model';
import type { KocAiRule, KocCodeRule, KocRuleGroup, KocScreeningRule } from './koc-rule.model';

export type KocCampaignWizardStepId = 'general' | 'discovery' | 'screening' | 'review';

export interface KocCampaignWizardStep {
  id: KocCampaignWizardStepId;
  label: string;
}

export interface KocCampaignWizardValidationIssue {
  key: string;
  path: string;
}

export interface KocCampaignWizardDraft {
  name: string;
  code: string;
  description?: string;
  targetAccepted: number;
  maximumDiscovered: number;
  maximumScreened: number;
  discoveryExecution: KocAiExecutionConfig;
  screeningExecution?: KocAiExecutionConfig;
  discoverySignals: KocDiscoverySignal[];
  searchStrategies: KocSearchStrategy[];
  screeningRules: KocScreeningRule[];
}

export const KOC_CAMPAIGN_WIZARD_STEPS: KocCampaignWizardStep[] = [
  { id: 'general', label: 'koc.campaignWizard.step.general' },
  { id: 'discovery', label: 'koc.campaignWizard.step.discovery' },
  { id: 'screening', label: 'koc.campaignWizard.step.screening' },
  { id: 'review', label: 'koc.campaignWizard.step.review' },
];

export function createDefaultCampaignWizardDraft(): KocCampaignWizardDraft {
  return {
    name: '',
    code: '',
    description: '',
    targetAccepted: 10,
    maximumDiscovered: 100,
    maximumScreened: 50,
    discoveryExecution: { agentCode: '' },
    discoverySignals: [
      { key: 'profile', label: 'koc.discovery.signal.profile', enabled: true, weight: 60 },
      { key: 'engagement', label: 'koc.discovery.signal.engagement', enabled: true, weight: 40 },
    ],
    searchStrategies: [createDefaultSearchStrategy()],
    screeningRules: [],
  };
}

export function createDefaultSearchStrategy(priority = 1): KocSearchStrategy {
  return {
    name: '',
    enabled: true,
    priority,
    keywords: [],
    maxQueries: 5,
    maxCandidates: 20,
  };
}

export function createDefaultCodeScreeningRule(group: KocRuleGroup, priority = 1): KocCodeRule {
  return {
    name: 'koc.rule.default.codeName',
    templateId: 'numeric-threshold',
    kind: 'CODE',
    group,
    enabled: true,
    priority,
    conditionKey: 'followers',
    threshold: 1000,
    whenEvidenceMatches: 'CONTINUE',
    whenEvidenceMissing: 'CONTINUE',
  };
}

export function createDefaultAiScreeningRule(group: KocRuleGroup, priority = 1): KocAiRule {
  return {
    name: 'koc.rule.default.aiName',
    templateId: 'custom-ai',
    kind: 'AI',
    group,
    enabled: true,
    priority,
    execution: { agentCode: '' },
    parameters: {
      lookbackDays: 30,
      evidenceKey: 'engagement',
      threshold: 1,
    },
    whenEvidenceMatches: 'CONTINUE',
    whenEvidenceMissing: 'CONTINUE',
  };
}

export function campaignDetailToWizardDraft(detail: KocCampaignDetail): KocCampaignWizardDraft {
  const fallback = createDefaultCampaignWizardDraft();
  return {
    ...fallback,
    name: detail.name,
    code: detail.code,
    description: detail.description ?? '',
    targetAccepted: detail.acceptedTarget,
    maximumDiscovered: detail.searchStrategies?.reduce((total, strategy) => total + strategy.maxCandidates, 0) || fallback.maximumDiscovered,
    maximumScreened: Math.max(detail.acceptedTarget, detail.counters.screened || fallback.maximumScreened),
    discoveryExecution: detail.discoveryExecution,
    screeningExecution: detail.screeningExecution,
    discoverySignals: detail.discoverySignals?.length ? detail.discoverySignals : fallback.discoverySignals,
    searchStrategies: detail.searchStrategies?.length ? detail.searchStrategies : fallback.searchStrategies,
    screeningRules: detail.screeningRules?.length ? detail.screeningRules : fallback.screeningRules,
  };
}

export function validateCampaignWizardDraft(draft: KocCampaignWizardDraft): KocCampaignWizardValidationIssue[] {
  const issues: KocCampaignWizardValidationIssue[] = [];
  if (!draft.name.trim()) {
    issues.push(issue('name', 'koc.campaignWizard.validation.nameRequired'));
  }
  if (!draft.code.trim()) {
    issues.push(issue('code', 'koc.campaignWizard.validation.codeRequired'));
  }
  if (!Number.isFinite(draft.targetAccepted) || draft.targetAccepted <= 0) {
    issues.push(issue('targetAccepted', 'koc.campaignWizard.validation.targetAcceptedPositive'));
  }
  if (draft.maximumDiscovered <= 0 || draft.maximumDiscovered < draft.targetAccepted) {
    issues.push(issue('maximumDiscovered', 'koc.campaignWizard.validation.maximumDiscoveredGteTarget'));
  }
  if (draft.maximumScreened <= 0 || draft.maximumScreened < draft.targetAccepted) {
    issues.push(issue('maximumScreened', 'koc.campaignWizard.validation.maximumScreenedGteTarget'));
  }
  if (!draft.discoveryExecution.agentCode.trim()) {
    issues.push(issue('discoveryExecution.agentCode', 'koc.campaignWizard.validation.discoveryAgentRequired'));
  }
  if (!draft.searchStrategies.length) {
    issues.push(issue('searchStrategies', 'koc.campaignWizard.validation.strategyRequired'));
  }
  draft.screeningRules.forEach((rule, index) => {
    if (rule.kind === 'AI' && !rule.execution.agentCode.trim()) {
      issues.push(issue(`screeningRules.${index}.execution.agentCode`, 'koc.campaignWizard.validation.screeningAiAgentRequired'));
    }
    if (rule.whenEvidenceMissing === 'REJECT_WITH_POLICY') {
      issues.push(issue(`screeningRules.${index}.whenEvidenceMissing`, 'koc.campaignWizard.validation.missingEvidenceCannotReject'));
    }
  });

  return issues;
}

export function toKocCampaignUpsertPayload(draft: KocCampaignWizardDraft): KocCampaignUpsertPayload {
  return {
    name: draft.name.trim(),
    code: draft.code.trim(),
    description: draft.description?.trim() || undefined,
    targetAccepted: draft.targetAccepted,
    maximumDiscovered: draft.maximumDiscovered,
    maximumScreened: draft.maximumScreened,
    discoveryExecution: {
      agentCode: draft.discoveryExecution.agentCode,
      ...(draft.discoveryExecution.provider ? { provider: draft.discoveryExecution.provider } : {}),
    },
    ...(draft.screeningExecution?.agentCode ? { screeningExecution: draft.screeningExecution } : {}),
    discoverySignals: draft.discoverySignals.map((signal) => ({ ...signal })),
    searchStrategies: draft.searchStrategies.map((strategy) => ({ ...strategy, keywords: [...strategy.keywords] })),
    screeningRules: draft.screeningRules.map(copyScreeningRule),
  };
}

function issue(path: string, key: string): KocCampaignWizardValidationIssue {
  return { path, key };
}

function copyScreeningRule(rule: KocScreeningRule): KocScreeningRule {
  if (rule.kind === 'AI') {
    return {
      ...rule,
      execution: {
        agentCode: rule.execution.agentCode,
        ...(rule.execution.provider ? { provider: rule.execution.provider } : {}),
      },
      parameters: { ...rule.parameters },
    };
  }
  return { ...rule };
}
