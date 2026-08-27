export type CampaignEditorStepId = 'campaign' | 'searchRequirements' | 'reviewStart';

export interface CampaignGoal {
  targetApproved: number;
  candidateLimit: number;
}

export interface CampaignSearchScope {
  platforms: string[];
  minFollowers: number | null;
  maxFollowers: number | null;
  locations: string[];
  languages: string[];
  recentActivityDays: number | null;
}

export interface CampaignRequirement {
  id: string;
  title: string;
  description: string;
  importance: 'REQUIRED' | 'PREFERRED';
  minimumConfidence: number | null;
  minimumEvidence: number | null;
}

export interface CampaignWorkflowRef {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersion: number | null;
  workflowName: string;
}

export interface CampaignEditorDraft {
  name: string;
  description: string;
  goal: CampaignGoal;
  search: {
    instructions: string;
    scope: CampaignSearchScope;
    requirements: CampaignRequirement[];
  };
  workflow: CampaignWorkflowRef;
}

export interface CampaignEditorPayload {
  name: string;
  description?: string;
  goal: CampaignGoal;
  search: {
    instructions?: string;
    scope: Partial<CampaignSearchScope>;
    requirements: CampaignRequirement[];
  };
  workflow: {
    workflowDefinitionId: string;
    workflowVersionId: string;
    workflowVersion: number;
  };
}

export interface CampaignEditorValidationIssue {
  path: string;
  key: string;
}

const DEFAULT_WORKFLOW_REF = {
  workflowDefinitionId: 'koc-search-evaluation',
  workflowVersionId: 'koc-search-evaluation-v1',
  workflowVersion: 1,
  workflowName: 'KOC Search & Evaluation',
} as const;

export function createDefaultCampaignEditorDraft(): CampaignEditorDraft {
  return {
    name: '',
    description: '',
    goal: {
      targetApproved: 10,
      candidateLimit: 50,
    },
    search: {
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
    },
    workflow: {
      ...DEFAULT_WORKFLOW_REF,
    },
  };
}

export function createCampaignRequirement(seed: Partial<CampaignRequirement> = {}): CampaignRequirement {
  return {
    id: seed.id ?? createRequirementId(),
    title: seed.title ?? '',
    description: seed.description ?? '',
    importance: seed.importance ?? 'REQUIRED',
    minimumConfidence: seed.minimumConfidence ?? null,
    minimumEvidence: seed.minimumEvidence ?? null,
  };
}

export function validateCampaignEditorDraft(draft: CampaignEditorDraft): CampaignEditorValidationIssue[] {
  const issues: CampaignEditorValidationIssue[] = [];

  if (!draft.name.trim()) {
    issues.push(issue('name', 'nameRequired'));
  }
  if (!Number.isFinite(draft.goal.targetApproved) || draft.goal.targetApproved <= 0) {
    issues.push(issue('goal.targetApproved', 'targetApprovedPositive'));
  }
  if (!Number.isFinite(draft.goal.candidateLimit) || draft.goal.candidateLimit < draft.goal.targetApproved) {
    issues.push(issue('goal.candidateLimit', 'candidateLimitGteTargetApproved'));
  }
  if (!draft.search.instructions.trim()) {
    issues.push(issue('search.instructions', 'instructionsRequired'));
  }
  if (!draft.search.requirements.length) {
    issues.push(issue('search.requirements', 'requirementsRequired'));
  }
  if (!draft.workflow.workflowDefinitionId.trim()) {
    issues.push(issue('workflow.workflowDefinitionId', 'workflowDefinitionRequired'));
  }
  if (!draft.workflow.workflowVersionId.trim()) {
    issues.push(issue('workflow.workflowVersionId', 'workflowVersionRequired'));
  }
  if (
    draft.workflow.workflowVersion == null ||
    !Number.isFinite(draft.workflow.workflowVersion) ||
    draft.workflow.workflowVersion <= 0
  ) {
    issues.push(issue('workflow.workflowVersion', 'workflowVersionNumberRequired'));
  }

  return issues;
}

export function toCampaignEditorPayload(draft: CampaignEditorDraft): CampaignEditorPayload {
  const workflowVersion = draft.workflow.workflowVersion;
  if (workflowVersion == null || !Number.isFinite(workflowVersion)) {
    throw new Error('workflowVersion is required before serialization');
  }

  return {
    name: draft.name,
    ...(draft.description ? { description: draft.description } : {}),
    goal: { ...draft.goal },
    search: {
      ...(draft.search.instructions ? { instructions: draft.search.instructions } : {}),
      scope: {
        platforms: [...draft.search.scope.platforms],
        minFollowers: draft.search.scope.minFollowers,
        maxFollowers: draft.search.scope.maxFollowers,
        locations: [...draft.search.scope.locations],
        languages: [...draft.search.scope.languages],
        recentActivityDays: draft.search.scope.recentActivityDays,
      },
      requirements: draft.search.requirements.map((requirement) => ({ ...requirement })),
    },
    workflow: {
      workflowDefinitionId: draft.workflow.workflowDefinitionId,
      workflowVersionId: draft.workflow.workflowVersionId,
      workflowVersion,
    },
  };
}

function issue(path: string, key: string): CampaignEditorValidationIssue {
  return { path, key: `koc.campaignEditor.validation.${key}` };
}

function createRequirementId(): string {
  return `requirement-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}
