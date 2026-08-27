import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PermissionService } from '@core/auth/permission.service';
import type { SelectValue } from '@shared/ui/primitives/select/select';
import type {
  CampaignEditorDraft,
  CampaignEditorStepId,
  CampaignRequirement,
  CampaignSearchScope,
  CampaignEditorValidationIssue,
} from '../../model/koc-campaign-editor.model';
import { CampaignEditorStore } from '../../stores/campaign-editor.store';

export type CampaignEditorMode = 'create' | 'edit';

interface CampaignEditorStep {
  id: CampaignEditorStepId;
  label: string;
}

const CAMPAIGN_EDITOR_STEPS: CampaignEditorStep[] = [
  { id: 'campaign', label: 'koc.campaignEditor.step.campaign' },
  { id: 'searchRequirements', label: 'koc.campaignEditor.step.searchRequirements' },
  { id: 'reviewStart', label: 'koc.campaignEditor.step.reviewStart' },
];

@Component({
  selector: 'app-koc-campaign-editor',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-editor.component.html',
  styleUrl: './campaign-editor.component.css',
  providers: [CampaignEditorStore],
})
export class CampaignEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissionService);

  readonly store = inject(CampaignEditorStore);
  readonly steps = CAMPAIGN_EDITOR_STEPS;
  readonly importanceOptions = [
    { label: 'koc.campaignEditor.importance.required', value: 'REQUIRED' },
    { label: 'koc.campaignEditor.importance.preferred', value: 'PREFERRED' },
  ];

  readonly mode: CampaignEditorMode =
    this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create';
  readonly pageTitle = this.mode === 'edit' ? 'koc.campaigns.edit.title' : 'koc.campaigns.create.title';
  readonly pageSubtitle =
    this.mode === 'edit'
      ? 'koc.campaigns.edit.subtitle'
      : 'koc.campaigns.create.subtitle';

  readonly canMutate = computed(() => this.permissionService.has('AI_AGENT_WORKFLOW_WRITE'));
  readonly activeStepIndex = computed(() =>
    Math.max(
      0,
      this.steps.findIndex((step) => step.id === this.store.activeStepId()),
    ),
  );
  readonly activeStep = computed(() => this.steps[this.activeStepIndex()] ?? this.steps[0]);
  readonly isFirstStep = computed(() => this.activeStepIndex() === 0);
  readonly isLastStep = computed(() => this.activeStepIndex() === this.steps.length - 1);
  readonly startDisabled = computed(
    () => !this.canMutate() || this.store.saving() || !isDraftReadyToStart(this.store.draft()),
  );

  ngOnInit(): void {
    this.store.initialize(this.route.snapshot.paramMap.get('campaignId'));
  }

  setStep(stepId: CampaignEditorStepId): void {
    this.store.setStep(stepId);
  }

  back(): void {
    this.store.back();
  }

  continue(): void {
    this.store.continue();
  }

  canContinue(): boolean {
    if (!this.canMutate() || this.store.saving()) {
      return false;
    }

    const draft = this.store.draft();
    switch (this.store.activeStepId()) {
      case 'campaign':
        return isCampaignStepComplete(draft);
      case 'searchRequirements':
        return isSearchRequirementsComplete(draft);
      default:
        return false;
    }
  }

  cancel(): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns']);
  }

  updateDraft(partial: Partial<CampaignEditorDraft>): void {
    this.store.updateDraft(partial);
  }

  updateGoal(partial: Partial<CampaignEditorDraft['goal']>): void {
    this.store.updateGoal(partial);
  }

  updateScope(partial: Partial<CampaignSearchScope>): void {
    this.store.updateScope(partial);
  }

  updateScopeList(field: 'platforms' | 'locations' | 'languages', rawValue: string | null): void {
    this.store.updateScope({ [field]: csvToList(rawValue) });
  }

  updateInstructions(value: string | null): void {
    this.store.updateInstructions(value ?? '');
  }

  addRequirement(): void {
    this.store.addRequirement();
  }

  updateRequirement(requirementId: string, partial: Partial<CampaignRequirement>): void {
    this.store.updateRequirement(requirementId, partial);
  }

  removeRequirement(requirementId: string): void {
    this.store.removeRequirement(requirementId);
  }

  hasUnsavedChanges(): boolean {
    return this.store.hasUnsavedChanges();
  }

  normalizeImportance(value: SelectValue): CampaignRequirement['importance'] {
    return value === 'PREFERRED' ? 'PREFERRED' : 'REQUIRED';
  }

  csv(values: string[]): string {
    return values.join(', ');
  }

  issueFor(path: string): string | null {
    return this.store.issueFor(path);
  }

  async saveDraft(): Promise<unknown> {
    if (!this.canMutate()) {
      return null;
    }
    return this.store.saveDraft();
  }

  async startCampaign(): Promise<void> {
    if (!this.canMutate()) {
      return;
    }

    const saved = await this.store.startCampaign();
    if (!saved) {
      const stepId = stepForValidationIssues(this.store.validationIssues());
      if (stepId) {
        this.store.setStep(stepId);
      }
      return;
    }

    await this.router.navigate([
      '/ai-agent-mcrs/koc/campaigns',
      saved.campaignId,
      'review',
    ]);
  }
}

function csvToList(rawValue: string | null): string[] {
  return (rawValue ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function stepForValidationIssues(issues: CampaignEditorValidationIssue[]): CampaignEditorStepId | null {
  if (issues.some((issue) => issue.path.startsWith('workflow.'))) {
    return 'reviewStart';
  }
  if (issues.some((issue) => issue.path.startsWith('search.'))) {
    return 'searchRequirements';
  }
  if (issues.some((issue) => issue.path.startsWith('goal.') || issue.path === 'name')) {
    return 'campaign';
  }
  return issues.length ? 'campaign' : null;
}

function isCampaignStepComplete(draft: CampaignEditorDraft): boolean {
  return (
    draft.name.trim().length > 0 &&
    draft.goal.targetApproved > 0 &&
    draft.goal.candidateLimit >= draft.goal.targetApproved
  );
}

function isSearchRequirementsComplete(draft: CampaignEditorDraft): boolean {
  return draft.search.requirements.length > 0;
}

function isDraftReadyToStart(draft: CampaignEditorDraft): boolean {
  return isCampaignStepComplete(draft) && isSearchRequirementsComplete(draft);
}
