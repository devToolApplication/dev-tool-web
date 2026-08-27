import { computed, inject, Injectable, signal, type Signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  createCampaignRequirement,
  createDefaultCampaignEditorDraft,
  toCampaignEditorPayload,
  validateCampaignEditorDraft,
  type CampaignEditorDraft,
  type CampaignEditorStepId,
  type CampaignEditorValidationIssue,
  type CampaignGoal,
  type CampaignRequirement,
  type CampaignSearchScope,
} from '../model/koc-campaign-editor.model';
import {
  KocCampaignEditorApiService,
  type CampaignEditorSavedCampaign,
} from '../services/koc-campaign-editor-api.service';

const STEP_ORDER: CampaignEditorStepId[] = ['campaign', 'searchRequirements', 'reviewStart'];

@Injectable()
export class CampaignEditorStore {
  private readonly apiService = inject(KocCampaignEditorApiService);
  private loadRequestId = 0;

  private readonly _draft = signal<CampaignEditorDraft>(createDefaultCampaignEditorDraft());
  private readonly _activeStepId = signal<CampaignEditorStepId>('campaign');
  private readonly _loading = signal<boolean>(false);
  private readonly _saving = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _validationIssues = signal<CampaignEditorValidationIssue[]>([]);
  private readonly _dirty = signal<boolean>(false);
  private readonly _savedCampaignId = signal<string | null>(null);

  readonly draft: Signal<CampaignEditorDraft> = this._draft.asReadonly();
  readonly activeStepId: Signal<CampaignEditorStepId> = this._activeStepId.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly saving: Signal<boolean> = this._saving.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();
  readonly validationIssues: Signal<CampaignEditorValidationIssue[]> = this._validationIssues.asReadonly();
  readonly dirty: Signal<boolean> = this._dirty.asReadonly();
  readonly savedCampaignId: Signal<string | null> = this._savedCampaignId.asReadonly();

  readonly canGoBack: Signal<boolean> = computed(() => {
    const currentIndex = STEP_ORDER.indexOf(this._activeStepId());
    return currentIndex > 0;
  });

  readonly canContinue: Signal<boolean> = computed(() => {
    const currentIndex = STEP_ORDER.indexOf(this._activeStepId());
    return currentIndex >= 0 && currentIndex < STEP_ORDER.length - 1;
  });

  initialize(campaignId?: string | null): void {
    this._error.set(null);
    this._validationIssues.set([]);
    this._activeStepId.set('campaign');
    const requestId = ++this.loadRequestId;

    if (!campaignId) {
      this._draft.set(createDefaultCampaignEditorDraft());
      this._savedCampaignId.set(null);
      this._dirty.set(false);
      this._loading.set(false);
      this._saving.set(false);
      return;
    }

    this._savedCampaignId.set(campaignId);
    this._loading.set(true);
    void this.loadCampaign(campaignId, requestId);
  }

  setStep(stepId: CampaignEditorStepId): void {
    this._activeStepId.set(stepId);
  }

  back(): void {
    const currentIndex = STEP_ORDER.indexOf(this._activeStepId());
    if (currentIndex > 0) {
      this._activeStepId.set(STEP_ORDER[currentIndex - 1]);
    }
  }

  continue(): void {
    const currentIndex = STEP_ORDER.indexOf(this._activeStepId());
    if (currentIndex >= 0 && currentIndex < STEP_ORDER.length - 1) {
      this._activeStepId.set(STEP_ORDER[currentIndex + 1]);
    }
  }

  updateDraft(partial: Partial<CampaignEditorDraft>): void {
    this._draft.update((current) => ({
      ...current,
      ...partial,
      goal: partial.goal ? { ...current.goal, ...partial.goal } : current.goal,
      search: partial.search
        ? {
            ...current.search,
            ...partial.search,
            scope: partial.search.scope
              ? { ...current.search.scope, ...partial.search.scope }
              : current.search.scope,
            requirements: partial.search.requirements
              ? [...partial.search.requirements]
              : current.search.requirements,
          }
        : current.search,
      workflow: partial.workflow ? { ...current.workflow, ...partial.workflow } : current.workflow,
    }));
    this.markDirty();
  }

  updateGoal(goal: Partial<CampaignGoal>): void {
    this._draft.update((current) => ({
      ...current,
      goal: {
        ...current.goal,
        ...goal,
      },
    }));
    this.markDirty();
  }

  updateScope(scope: Partial<CampaignSearchScope>): void {
    this._draft.update((current) => ({
      ...current,
      search: {
        ...current.search,
        scope: {
          ...current.search.scope,
          ...scope,
        },
      },
    }));
    this.markDirty();
  }

  updateInstructions(instructions: string): void {
    this._draft.update((current) => ({
      ...current,
      search: {
        ...current.search,
        instructions,
      },
    }));
    this.markDirty();
  }

  addRequirement(): void {
    this._draft.update((current) => ({
      ...current,
      search: {
        ...current.search,
        requirements: [...current.search.requirements, createCampaignRequirement()],
      },
    }));
    this.markDirty();
  }

  updateRequirement(requirementId: string, partial: Partial<CampaignRequirement>): void {
    this._draft.update((current) => ({
      ...current,
      search: {
        ...current.search,
        requirements: current.search.requirements.map((req) =>
          req.id === requirementId ? { ...req, ...partial } : req,
        ),
      },
    }));
    this.markDirty();
  }

  removeRequirement(requirementId: string): void {
    this._draft.update((current) => ({
      ...current,
      search: {
        ...current.search,
        requirements: current.search.requirements.filter((req) => req.id !== requirementId),
      },
    }));
    this.markDirty();
  }

  async saveDraft(): Promise<CampaignEditorSavedCampaign | null> {
    const issues = validateCampaignEditorDraft(this._draft());
    this._validationIssues.set(issues);
    if (issues.length > 0) {
      return null;
    }

    this._saving.set(true);
    this._error.set(null);
    try {
      const payload = toCampaignEditorPayload(this._draft());
      const campaignId = this._savedCampaignId();
      const saved = campaignId
        ? await firstValueFrom(this.apiService.updateCampaign(campaignId, payload))
        : await firstValueFrom(this.apiService.createCampaign(payload));

      this._savedCampaignId.set(saved.campaignId);
      this._dirty.set(false);
      return saved;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'koc.campaignEditor.error.saveFailed');
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  async startCampaign(): Promise<CampaignEditorSavedCampaign | null> {
    const saved = await this.saveDraft();
    if (!saved) {
      return null;
    }

    this._saving.set(true);
    this._error.set(null);
    try {
      const started = await firstValueFrom(this.apiService.startCampaign(saved.campaignId));
      this._savedCampaignId.set(started.campaignId);
      return started;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'koc.campaignEditor.error.startFailed');
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  hasUnsavedChanges(): boolean {
    return this._dirty();
  }

  issueFor(path: string): string | null {
    return this._validationIssues().find((issue) => issue.path === path)?.key ?? null;
  }

  private markDirty(): void {
    this._dirty.set(true);
  }

  private async loadCampaign(campaignId: string, requestId: number): Promise<void> {
    try {
      const campaign = await firstValueFrom(this.apiService.getCampaign(campaignId));
      if (requestId !== this.loadRequestId) {
        return;
      }

      // ponytail: in-memory draft hydration from payload; extend if api adds more metadata
      this._draft.set({
        name: campaign.payload.name,
        description: campaign.payload.description ?? '',
        goal: { ...campaign.payload.goal },
        search: {
          instructions: campaign.payload.search.instructions ?? '',
          scope: {
            platforms: [...(campaign.payload.search.scope.platforms ?? [])],
            minFollowers: campaign.payload.search.scope.minFollowers ?? null,
            maxFollowers: campaign.payload.search.scope.maxFollowers ?? null,
            locations: [...(campaign.payload.search.scope.locations ?? [])],
            languages: [...(campaign.payload.search.scope.languages ?? [])],
            recentActivityDays: campaign.payload.search.scope.recentActivityDays ?? null,
          },
          requirements: campaign.payload.search.requirements.map((r) => ({ ...r })),
        },
        workflow: {
          workflowDefinitionId: campaign.payload.workflow.workflowDefinitionId,
          workflowVersionId: campaign.payload.workflow.workflowVersionId,
          workflowVersion: campaign.payload.workflow.workflowVersion,
          workflowName: 'KOC Search & Evaluation',
        },
      });
      this._dirty.set(false);
    } catch (err) {
      if (requestId !== this.loadRequestId) {
        return;
      }
      this._error.set(err instanceof Error ? err.message : 'koc.campaignEditor.error.loadFailed');
    } finally {
      if (requestId === this.loadRequestId) {
        this._loading.set(false);
      }
    }
  }
}
