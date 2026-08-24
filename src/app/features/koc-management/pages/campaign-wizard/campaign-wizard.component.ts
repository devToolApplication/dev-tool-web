import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import { ToastService } from '@core/notifications/toast.service';
import type { KocAgentCatalogItem } from '../../model/koc-agent.model';
import type { KocCampaignDetail } from '../../model/koc-campaign.model';
import type { KocAiExecutionConfig } from '../../model/koc-common.model';
import type { KocSearchStrategy } from '../../model/koc-discovery.model';
import {
  KOC_RULE_GROUPS,
  KOC_RULE_TEMPLATES,
  type KocAiRule,
  type KocCodeRule,
  type KocRuleGroup,
  type KocRuleTemplateId,
  type KocRuleTemplateOption,
  type KocScreeningRule,
} from '../../model/koc-rule.model';
import {
  KOC_CAMPAIGN_WIZARD_STEPS,
  campaignDetailToWizardDraft,
  createDefaultAiScreeningRule,
  createDefaultCampaignWizardDraft,
  createDefaultCodeScreeningRule,
  createDefaultSearchStrategy,
  toKocCampaignUpsertPayload,
  validateCampaignWizardDraft,
  type KocCampaignWizardDraft,
  type KocCampaignWizardStepId,
  type KocCampaignWizardValidationIssue,
} from '../../model/koc-campaign-wizard.model';
import { KocAgentApiService } from '../../services/koc-agent-api.service';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';

export type KocCampaignWizardMode = 'create' | 'edit';
type KocScreeningRulePatch = Partial<KocCodeRule> | Partial<KocAiRule>;

@Component({
  selector: 'app-koc-campaign-wizard',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-wizard.component.html',
  styleUrl: './campaign-wizard.component.css',
})
export class CampaignWizardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignApi = inject(KocCampaignApiService);
  private readonly agentApi = inject(KocAgentApiService);
  private readonly permissionService = inject(PermissionService);
  private readonly toastService = inject(ToastService);

  readonly mode = signal<KocCampaignWizardMode>(
    this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create',
  );
  readonly campaignId = signal(this.route.snapshot.paramMap.get('campaignId'));
  readonly draft = signal<KocCampaignWizardDraft>(createDefaultCampaignWizardDraft());
  readonly agents = signal<KocAgentCatalogItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeStepId = signal<KocCampaignWizardStepId>('general');
  readonly validationIssues = signal<KocCampaignWizardValidationIssue[]>([]);
  readonly dirty = signal(false);
  readonly savedCampaignId = signal<string | null>(this.campaignId());

  readonly canMutate = computed(() => this.permissionService.has('AI_AGENT_WORKFLOW_WRITE'));

  readonly steps = KOC_CAMPAIGN_WIZARD_STEPS;
  readonly ruleGroups = KOC_RULE_GROUPS;
  readonly ruleTemplates = KOC_RULE_TEMPLATES;
  readonly outcomeOptions = [
    { label: 'koc.rule.outcome.accept', value: 'ACCEPT' },
    { label: 'koc.rule.outcome.reject', value: 'REJECT' },
    { label: 'koc.rule.outcome.continue', value: 'CONTINUE' },
    { label: 'koc.rule.outcome.review', value: 'REVIEW' },
  ];
  readonly missingEvidenceOptions = [
    { label: 'koc.rule.missing.continue', value: 'CONTINUE' },
    { label: 'koc.rule.missing.review', value: 'REVIEW' },
    { label: 'koc.rule.missing.rejectWithPolicy', value: 'REJECT_WITH_POLICY' },
  ];
  readonly activeStepIndex = computed(() =>
    this.steps.findIndex((step) => step.id === this.activeStepId()),
  );
  readonly activeStep = computed(() => this.steps[this.activeStepIndex()] ?? this.steps[0]);
  readonly isFirstStep = computed(() => this.activeStepIndex() <= 0);
  readonly isLastStep = computed(() => this.activeStepIndex() === this.steps.length - 1);
  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'koc.campaigns.edit.title' : 'koc.campaigns.create.title',
  );
  readonly pageSubtitle = computed(() =>
    this.mode() === 'edit' ? 'koc.campaigns.edit.subtitle' : 'koc.campaigns.create.subtitle',
  );
  readonly hasBlockingProvider = computed(() => this.selectedProviderBlocked());
  readonly startDisabled = computed(
    () =>
      !this.canMutate() ||
      validateCampaignWizardDraft(this.draft()).length > 0 ||
      this.hasBlockingProvider() ||
      this.saving(),
  );

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    const campaignId = this.campaignId();
    forkJoin({
      agents: this.agentApi.getAgents(),
      campaign: campaignId
        ? this.campaignApi.getCampaign(campaignId)
        : of<KocCampaignDetail | null>(null),
    }).subscribe({
      next: ({ agents, campaign }) => {
        this.agents.set(agents);
        if (campaign) {
          this.draft.set(campaignDetailToWizardDraft(campaign));
          this.savedCampaignId.set(campaign.campaignId);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  updateDraft(partial: Partial<KocCampaignWizardDraft>): void {
    this.draft.update((current) => ({ ...current, ...partial }));
    this.markDirty();
  }

  updateDiscoveryExecution(execution: KocAiExecutionConfig): void {
    this.draft.update((current) => ({ ...current, discoveryExecution: execution }));
    this.markDirty();
  }

  addSearchStrategy(): void {
    this.draft.update((current) => ({
      ...current,
      searchStrategies: [
        ...current.searchStrategies,
        createDefaultSearchStrategy(current.searchStrategies.length + 1),
      ],
    }));
    this.markDirty();
  }

  removeSearchStrategy(index: number): void {
    this.draft.update((current) => ({
      ...current,
      searchStrategies: current.searchStrategies.filter(
        (_strat, stratIndex) => stratIndex !== index,
      ),
    }));
    this.markDirty();
  }

  updateSearchStrategy(index: number, partial: Partial<KocSearchStrategy>): void {
    this.draft.update((current) => ({
      ...current,
      searchStrategies: current.searchStrategies.map((strategy, strategyIndex) =>
        strategyIndex === index ? { ...strategy, ...partial } : strategy,
      ),
    }));
    this.markDirty();
  }

  updateSignal(index: number, partial: { enabled?: boolean; weight?: number }): void {
    this.draft.update((current) => ({
      ...current,
      discoverySignals: current.discoverySignals.map((sig, sigIndex) =>
        sigIndex === index ? { ...sig, ...partial } : sig,
      ),
    }));
    this.markDirty();
  }

  addStrategy(): void {
    this.addSearchStrategy();
  }

  removeStrategy(index: number): void {
    this.removeSearchStrategy(index);
  }

  updateStrategy(index: number, partial: Partial<KocSearchStrategy>): void {
    this.updateSearchStrategy(index, partial);
  }

  strategyKeywords(strategy: KocSearchStrategy): string {
    return (strategy.keywords ?? []).join(', ');
  }

  updateStrategyKeywords(index: number, rawKeywords: string | null): void {
    const keywords = (rawKeywords ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    this.updateSearchStrategy(index, { keywords });
  }

  addCodeRule(group: KocRuleGroup): void {
    const priority = this.nextRulePriority(group);
    this.addScreeningRule(createDefaultCodeScreeningRule(group, priority));
  }

  addAiRule(group: KocRuleGroup): void {
    const priority = this.nextRulePriority(group);
    this.addScreeningRule(createDefaultAiScreeningRule(group, priority));
  }

  ruleTemplatesForGroup(group: KocRuleGroup): KocRuleTemplateOption[] {
    return this.ruleTemplates.filter((t) => t.group === group);
  }

  addRuleFromTemplate(templateId: KocRuleTemplateId): void {
    const template = this.ruleTemplates.find((t) => t.templateId === templateId);
    if (!template) {
      return;
    }
    this.addScreeningRuleFromTemplate(templateId, template.group);
  }

  screeningRulesForGroup(group: KocRuleGroup): KocScreeningRule[] {
    return this.draft().screeningRules.filter((rule) => rule.group === group);
  }

  screeningRuleIndex(rule: KocScreeningRule): number {
    return this.draft().screeningRules.indexOf(rule);
  }

  addScreeningRuleFromTemplate(templateId: KocRuleTemplateId, group: KocRuleGroup): void {
    const priority = this.nextRulePriority(group);
    const template = this.ruleTemplates.find((t) => t.templateId === templateId);
    const isAi = template
      ? template.kind === 'AI'
      : templateId === 'custom-ai' || templateId === 'comment-quality';
    const rule = isAi
      ? createDefaultAiScreeningRule(group, priority)
      : createDefaultCodeScreeningRule(group, priority);
    rule.templateId = templateId;
    this.addScreeningRule(rule);
  }

  addScreeningRule(rule: KocScreeningRule): void {
    this.draft.update((current) => ({
      ...current,
      screeningRules: [...current.screeningRules, rule],
    }));
    this.markDirty();
  }

  removeScreeningRule(index: number): void {
    this.draft.update((current) => ({
      ...current,
      screeningRules: current.screeningRules.filter((_rule, ruleIndex) => ruleIndex !== index),
    }));
    this.markDirty();
  }

  updateScreeningRule(index: number, partial: KocScreeningRulePatch): void {
    this.draft.update((current) => ({
      ...current,
      screeningRules: current.screeningRules.map((rule, ruleIndex) =>
        ruleIndex === index ? this.mergeScreeningRule(rule, partial) : rule,
      ),
    }));
    this.markDirty();
  }

  updateAiRuleExecution(index: number, value: KocAiExecutionConfig): void {
    this.updateScreeningRule(index, { execution: value } as Partial<KocScreeningRule>);
  }

  updateAiRuleParameter(
    index: number,
    key: keyof KocAiRule['parameters'],
    value: string | number | boolean | null,
  ): void {
    const rule = this.draft().screeningRules[index];
    if (!rule || rule.kind !== 'AI') {
      return;
    }
    this.updateScreeningRule(index, {
      parameters: { ...rule.parameters, [key]: value },
    } as Partial<KocScreeningRule>);
  }

  asCodeRule(rule: KocScreeningRule): KocCodeRule {
    return rule as KocCodeRule;
  }

  asAiRule(rule: KocScreeningRule): KocAiRule {
    return rule as KocAiRule;
  }

  setStep(stepId: KocCampaignWizardStepId): void {
    this.activeStepId.set(stepId);
  }

  backStep(): void {
    const index = this.activeStepIndex();
    if (index > 0) {
      this.activeStepId.set(this.steps[index - 1].id);
    }
  }

  continueStep(): void {
    const index = this.activeStepIndex();
    if (index < this.steps.length - 1) {
      this.activeStepId.set(this.steps[index + 1].id);
    }
  }

  cancel(): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns']);
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  async saveDraft(): Promise<KocCampaignDetail | null> {
    if (!this.canMutate()) {
      return null;
    }

    const issues = validateCampaignWizardDraft(this.draft());
    this.validationIssues.set(issues);
    if (issues.length) {
      return null;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const payload = toKocCampaignUpsertPayload(this.draft());
      const campaignId = this.savedCampaignId();
      const saved = campaignId
        ? await firstValueFrom(this.campaignApi.updateCampaign(campaignId, payload))
        : await firstValueFrom(this.campaignApi.createCampaign(payload));
      this.savedCampaignId.set(saved.campaignId);
      this.dirty.set(false);
      return saved;
    } catch (error) {
      this.toastService.error(errorMessage(error));
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  async startCampaign(): Promise<void> {
    if (this.startDisabled() || !this.canMutate()) {
      this.validationIssues.set(validateCampaignWizardDraft(this.draft()));
      return;
    }

    const saved = await this.saveDraft();
    if (!saved) {
      return;
    }

    this.saving.set(true);
    try {
      await firstValueFrom(this.campaignApi.startCampaign(saved.campaignId));
      await this.router.navigate(['/ai-agent-mcrs/koc/campaigns', saved.campaignId]);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  issueFor(path: string): string | null {
    return this.validationIssues().find((issue) => issue.path === path)?.key ?? null;
  }

  private selectedProviderBlocked(): boolean {
    const execution = this.draft().discoveryExecution;
    const selectedAgent = this.agents().find((agent) => agent.agentCode === execution.agentCode);
    if (!selectedAgent || !execution.provider) {
      return false;
    }
    const provider = selectedAgent.supportedProviders.find(
      (option) => option.provider === execution.provider,
    );
    return !provider?.available || provider.health === 'UNHEALTHY';
  }

  private markDirty(): void {
    this.dirty.set(true);
  }

  private nextRulePriority(group: KocRuleGroup): number {
    return this.draft().screeningRules.filter((rule) => rule.group === group).length + 1;
  }

  private mergeScreeningRule(
    rule: KocScreeningRule,
    partial: KocScreeningRulePatch,
  ): KocScreeningRule {
    if (rule.kind === 'AI') {
      return {
        ...rule,
        ...(partial as Partial<KocAiRule>),
        kind: 'AI',
        parameters: {
          ...rule.parameters,
          ...((partial as Partial<KocAiRule>).parameters ?? {}),
        },
      };
    }
    return {
      ...rule,
      ...(partial as Partial<KocCodeRule>),
      kind: 'CODE',
    };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.campaignWizard.error.saveFailed';
}
