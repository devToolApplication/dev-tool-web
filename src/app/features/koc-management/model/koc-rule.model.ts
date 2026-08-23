import type { KocAiExecutionConfig } from './koc-common.model';

export type KocRuleKind = 'CODE' | 'AI';
export type KocRuleGroup = 'HARD_FILTERS' | 'QUALIFICATION' | 'EXCLUSIONS' | 'ENGAGEMENT';
export type KocRuleOutcome = 'ACCEPT' | 'REJECT' | 'CONTINUE' | 'REVIEW';
export type KocMissingEvidenceAction = 'CONTINUE' | 'REVIEW' | 'REJECT_WITH_POLICY';
export type KocRuleTemplateId =
  | 'numeric-threshold'
  | 'date-lookback'
  | 'recent-promotion'
  | 'child-parent-evidence'
  | 'education-achievement'
  | 'post-engagement'
  | 'comment-quality'
  | 'custom-ai';

export interface KocRuleGroupOption {
  group: KocRuleGroup;
  label: string;
}

export interface KocRuleTemplateOption {
  templateId: KocRuleTemplateId;
  label: string;
  kind: KocRuleKind;
  group: KocRuleGroup;
}

export interface KocRuleBase {
  ruleId?: string;
  name: string;
  templateId?: KocRuleTemplateId;
  kind: KocRuleKind;
  group: KocRuleGroup;
  enabled: boolean;
  priority: number;
  whenEvidenceMatches: KocRuleOutcome;
  whenEvidenceMissing: KocMissingEvidenceAction;
}

export interface KocCodeRule extends KocRuleBase {
  kind: 'CODE';
  conditionKey: string;
  threshold?: number;
}

export interface KocAiRule extends KocRuleBase {
  kind: 'AI';
  execution: KocAiExecutionConfig;
  parameters: Record<string, string | number | boolean | null>;
}

export type KocScreeningRule = KocCodeRule | KocAiRule;

export const KOC_RULE_GROUPS: KocRuleGroupOption[] = [
  { group: 'HARD_FILTERS', label: 'koc.rule.group.hardFilters' },
  { group: 'QUALIFICATION', label: 'koc.rule.group.qualification' },
  { group: 'EXCLUSIONS', label: 'koc.rule.group.exclusions' },
  { group: 'ENGAGEMENT', label: 'koc.rule.group.engagement' },
];

export const KOC_RULE_TEMPLATES: KocRuleTemplateOption[] = [
  {
    templateId: 'numeric-threshold',
    label: 'koc.rule.template.numericThreshold',
    kind: 'CODE',
    group: 'HARD_FILTERS',
  },
  {
    templateId: 'date-lookback',
    label: 'koc.rule.template.dateLookback',
    kind: 'CODE',
    group: 'QUALIFICATION',
  },
  {
    templateId: 'recent-promotion',
    label: 'koc.rule.template.recentPromotion',
    kind: 'CODE',
    group: 'EXCLUSIONS',
  },
  {
    templateId: 'child-parent-evidence',
    label: 'koc.rule.template.childParentEvidence',
    kind: 'AI',
    group: 'QUALIFICATION',
  },
  {
    templateId: 'education-achievement',
    label: 'koc.rule.template.educationAchievement',
    kind: 'AI',
    group: 'QUALIFICATION',
  },
  {
    templateId: 'post-engagement',
    label: 'koc.rule.template.postEngagement',
    kind: 'CODE',
    group: 'ENGAGEMENT',
  },
  {
    templateId: 'comment-quality',
    label: 'koc.rule.template.commentQuality',
    kind: 'AI',
    group: 'ENGAGEMENT',
  },
  {
    templateId: 'custom-ai',
    label: 'koc.rule.template.customAi',
    kind: 'AI',
    group: 'ENGAGEMENT',
  },
];
