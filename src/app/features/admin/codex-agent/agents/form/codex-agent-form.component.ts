import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import {
  CodexAgentAuthStatusResponse,
  CodexAgentCreateDto,
  CodexAgentDeviceLoginSessionResponse,
  CodexAgentFieldDescriptionResponse,
  CodexAgentOptionItemResponse,
  CodexAgentOptionsResponse,
  CodexAgentResponse,
  CodexAgentUpdateDto,
  CodexAgentUsageWindowResponse
} from '../../../../../core/models/codex-agent/codex-agent.model';
import { CodexAgentService } from '../../../../../core/services/codex-agent-service/codex-agent.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FieldGuideFieldItem, FieldGuideOptionItem } from '../../../../../shared/ui/field-guide-panel/field-guide-panel.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { CODEX_AGENT_INITIAL_VALUE, CODEX_AGENT_ROUTES } from '../codex-agent.constants';

@Component({
  selector: 'app-codex-agent-form',
  standalone: false,
  templateUrl: './codex-agent-form.component.html'
})
export class CodexAgentFormComponent implements OnInit, OnDestroy {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'code',
        label: 'Code',
        width: '1/2',
        validation: [Rules.required('Code is required')],
        helpText: 'Stable unique code used to create the per-agent CODEX_HOME folder name.'
      },
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        width: '1/2',
        validation: [Rules.required('Name is required')],
        helpText: 'Display name shown in the management UI.'
      },
      { type: 'select', name: 'model', label: 'Model', width: '1/2', optionsExpression: 'context.extra?.modelOptions || []' },
      {
        type: 'select',
        name: 'reasoningEffort',
        label: 'Reasoning Effort',
        width: '1/2',
        optionsExpression: 'context.extra?.reasoningEffortOptions || []'
      },
      {
        type: 'select',
        name: 'sandboxMode',
        label: 'Sandbox Mode',
        width: '1/2',
        optionsExpression: 'context.extra?.sandboxModeOptions || []'
      },
      {
        type: 'select',
        name: 'approvalPolicy',
        label: 'Approval Policy',
        width: '1/2',
        optionsExpression: 'context.extra?.approvalPolicyOptions || []'
      },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' },
      { type: 'select', name: 'status', label: 'Status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'text', name: 'installationId', label: 'Installation Id', width: '1/3', helpText: 'Optional installation id written into the agent home. Leave empty to inherit the shared project installation id.' },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full', helpText: 'Internal note describing when this Codex agent should be used.' },
      { type: 'textarea', name: 'instruction', label: 'AGENTS.md Instruction', width: 'full', showZoomButton: true, helpText: 'Custom runtime instructions written into AGENTS.md for this agent.' },
      {
        type: 'textarea',
        name: 'authJson',
        label: 'auth.json Content',
        width: 'full',
        showZoomButton: true,
        contentType: 'json',
        jsonValidationMessage: 'Invalid JSON',
        helpText: 'Paste the auth.json content used for auto-login. This also enables token/quota inspection in the detail panel.'
      }
    ]
  };

  editId: string | null = null;
  loading = false;
  authLoading = false;
  authDeviceLoading = false;
  syncLoading = false;
  formInitialValue: CodexAgentCreateDto = this.createInitialValue();
  readonly formVisible = signal(true);
  private authSessionPollTimer: number | null = null;
  authStatus: CodexAgentAuthStatusResponse | null = null;
  options: CodexAgentOptionsResponse | null = null;
  optionDescriptions: Record<string, string> = {};
  currentFormValue: Partial<CodexAgentCreateDto> = {};
  deviceLoginSession: CodexAgentDeviceLoginSessionResponse | null = null;

  constructor(
    private readonly codexAgentService: CodexAgentService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  ngOnDestroy(): void {
    this.stopDeviceLoginPolling();
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editId ? 'Edit Codex Agent' : 'Create Codex Agent',
      description: 'Store agent runtime profile, auth.json content and per-agent CODEX_HOME settings.',
      actions: [
        { id: 'back', label: 'Back', icon: 'pi pi-arrow-left', goBack: true },
        ...(this.editId
          ? [{ id: 'sync-home', label: 'Sync Home', icon: 'pi pi-refresh', loading: this.syncLoading }]
          : []),
        { id: 'save', label: this.editId ? 'Update' : 'Create', icon: 'pi pi-save', submitForm: true, loading: this.loading }
      ]
    };
  }

  onSubmitForm(model: CodexAgentCreateDto): void {
    const payload: CodexAgentCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      description: model.description?.trim() || '',
      model: model.model?.trim() || '',
      installationId: model.installationId?.trim() || '',
      instruction: model.instruction?.trim() || '',
      authJson: model.authJson?.trim() || ''
    };
    const request$ = this.editId
      ? this.codexAgentService.update(this.editId, payload as CodexAgentUpdateDto)
      : this.codexAgentService.create(payload);

    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (saved) => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([`${CODEX_AGENT_ROUTES.list}/edit`, saved.id]);
      },
      error: () => this.toastService.error('Save Codex agent failed')
    });
  }

  onActionClick(actionId: string): void {
    if (actionId !== 'sync-home' || !this.editId) {
      return;
    }

    this.syncLoading = true;
    this.loadingService.track(this.codexAgentService.syncHome(this.editId)).pipe(finalize(() => (this.syncLoading = false))).subscribe({
      next: (result) => {
        this.toastService.info(`Synced CODEX_HOME: ${result.agentHome}`);
        this.loadAuthStatus(this.editId!);
      },
      error: () => this.toastService.error('Sync CODEX_HOME failed')
    });
  }

  startDeviceAuth(): void {
    if (!this.editId) {
      return;
    }

    this.authDeviceLoading = true;
    this.stopDeviceLoginPolling();
    this.loadingService.track(this.codexAgentService.startDeviceLogin(this.editId)).pipe(finalize(() => (this.authDeviceLoading = false))).subscribe({
      next: (session) => {
        this.deviceLoginSession = session;
        this.toastService.info('Device auth session created');
        this.handleDeviceLoginSession(this.editId!, session);
      },
      error: () => this.toastService.error('Start device auth failed')
    });
  }

  reloadAuthStatus(): void {
    if (!this.editId) {
      return;
    }
    this.loadAuthStatus(this.editId);
  }

  authStatusLabel(): string {
    if (!this.authStatus?.configured) {
      return 'Not Configured';
    }
    return this.authStatus.authenticated ? 'Authenticated' : 'Expired / Missing Token';
  }

  authStatusSeverity(): 'success' | 'warn' | 'danger' | 'info' {
    if (!this.authStatus?.configured) {
      return 'warn';
    }
    return this.authStatus.authenticated ? 'success' : 'danger';
  }

  displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return String(value);
  }

  usageCounter(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window) {
      return 'N/A';
    }
    if (this.hasNumber(window.remaining) && this.hasNumber(window.limit)) {
      return `${window.remaining} / ${window.limit}`;
    }
    if (this.hasNumber(window.remainingPercent)) {
      return `${window.remainingPercent}% left`;
    }
    if (this.hasNumber(window.usedPercent)) {
      return `${window.usedPercent}% used`;
    }
    if (this.hasNumber(window.remaining)) {
      return String(window.remaining);
    }
    if (this.hasNumber(window.limit)) {
      return `limit ${window.limit}`;
    }
    return 'N/A';
  }

  usageReset(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window) {
      return 'N/A';
    }
    if (window.resetAt) {
      return `${this.formatLocalDateTime(window.resetAt)} (${this.relativeTimeToNow(window.resetAt)})`;
    }
    if (window.windowHours) {
      return `${window.windowHours}h rolling window`;
    }
    return window.resetMode || 'Unknown';
  }

  usageWindowLabel(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window?.windowHours) {
      return 'Window unknown';
    }
    if (window.windowHours % 24 === 0) {
      return `${Math.round(window.windowHours / 24)}d window`;
    }
    return `${window.windowHours}h window`;
  }

  fieldDescription(key: string): string {
    return this.optionDescriptions[key] || 'N/A';
  }

  optionDescription(list: CodexAgentOptionItemResponse[] | undefined, value: string | undefined | null): string {
    if (!value || !list?.length) {
      return 'N/A';
    }
    return list.find((item) => item.value === value)?.description || 'N/A';
  }

  onFormValueChange(value: Partial<CodexAgentCreateDto>): void {
    this.currentFormValue = value ?? {};
  }

  fieldGuideFields(): FieldGuideFieldItem[] {
    return [
      { key: 'model', label: 'Model', description: this.fieldDescription('model') },
      { key: 'reasoningEffort', label: 'Reasoning Effort', description: this.fieldDescription('reasoningEffort') },
      { key: 'sandboxMode', label: 'Sandbox Mode', description: this.fieldDescription('sandboxMode') },
      { key: 'approvalPolicy', label: 'Approval Policy', description: this.fieldDescription('approvalPolicy') }
    ];
  }

  fieldGuideSelections(): FieldGuideOptionItem[] {
    return [
      {
        title: 'Selected Model',
        description: this.optionDescription(optionsOrEmpty(this.options?.models), this.currentFormValue.model ?? this.formInitialValue.model)
      },
      {
        title: 'Selected Reasoning Effort',
        description: this.optionDescription(optionsOrEmpty(this.options?.reasoningEfforts), this.currentFormValue.reasoningEffort ?? this.formInitialValue.reasoningEffort)
      },
      {
        title: 'Selected Sandbox Mode',
        description: this.optionDescription(optionsOrEmpty(this.options?.sandboxModes), this.currentFormValue.sandboxMode ?? this.formInitialValue.sandboxMode)
      },
      {
        title: 'Selected Approval Policy',
        description: this.optionDescription(optionsOrEmpty(this.options?.approvalPolicies), this.currentFormValue.approvalPolicy ?? this.formInitialValue.approvalPolicy)
      }
    ];
  }

  private loadOptions(): void {
    this.loading = true;
    this.loadingService.track(this.codexAgentService.getOptions()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (options) => {
        this.options = options;
        this.optionDescriptions = Object.fromEntries((options.fields ?? []).map((field: CodexAgentFieldDescriptionResponse) => [field.key, field.description]));
        this.formContext.extra = {
          modelOptions: this.toSelectOptions(options.models),
          reasoningEffortOptions: this.toSelectOptions(options.reasoningEfforts),
          sandboxModeOptions: this.toSelectOptions(options.sandboxModes),
          approvalPolicyOptions: this.toSelectOptions(options.approvalPolicies)
        };
        this.bindRouteMode();
      },
      error: () => {
        this.options = null;
        this.optionDescriptions = {};
        this.formContext.extra = {
          modelOptions: [],
          reasoningEffortOptions: [],
          sandboxModeOptions: [],
          approvalPolicyOptions: []
        };
        this.toastService.error('Load Codex options failed');
        this.bindRouteMode();
      }
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    this.stopDeviceLoginPolling();
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialValue();
      this.currentFormValue = { ...this.formInitialValue };
      this.authStatus = null;
      this.deviceLoginSession = null;
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loadAgentDetail(id);
  }

  private loadAgentDetail(id: string, preserveDeviceSession = false): void {
    this.loading = true;
    this.loadingService.track(this.codexAgentService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: CodexAgentResponse) => {
        this.formInitialValue = {
          code: detail.code,
          name: detail.name,
          description: detail.description ?? '',
          model: detail.model ?? '',
          reasoningEffort: detail.reasoningEffort ?? 'medium',
          sandboxMode: detail.sandboxMode ?? 'workspace-write',
          approvalPolicy: detail.approvalPolicy ?? 'on-request',
          instruction: detail.instruction ?? '',
          authJson: detail.authJson ?? '',
          installationId: detail.installationId ?? '',
          enabled: detail.enabled ?? true,
          status: detail.status ?? 'ACTIVE'
        };
        this.currentFormValue = { ...this.formInitialValue };
        if (!preserveDeviceSession) {
          this.deviceLoginSession = null;
        }
        this.rerenderForm();
        this.loadAuthStatus(id);
      },
      error: () => {
        this.toastService.error('Load Codex agent detail failed');
        void this.router.navigate([CODEX_AGENT_ROUTES.list]);
      }
    });
  }

  private handleDeviceLoginSession(id: string, session: CodexAgentDeviceLoginSessionResponse): void {
    if (!session.sessionId) {
      return;
    }
    if (session.state === 'authenticated') {
      this.stopDeviceLoginPolling();
      this.toastService.info('Device auth completed');
      this.loadAgentDetail(id, true);
      return;
    }
    if (session.state === 'failed' || session.state === 'expired') {
      this.stopDeviceLoginPolling();
      this.loadAuthStatus(id);
      return;
    }

    this.scheduleDeviceLoginPolling(id, session.sessionId);
  }

  private scheduleDeviceLoginPolling(id: string, sessionId: string): void {
    this.stopDeviceLoginPolling();
    this.authSessionPollTimer = window.setTimeout(() => {
      this.loadingService.track(this.codexAgentService.getDeviceLoginSession(id, sessionId)).subscribe({
        next: (session) => {
          this.deviceLoginSession = session;
          this.handleDeviceLoginSession(id, session);
        },
        error: () => {
          this.stopDeviceLoginPolling();
          this.toastService.error('Load device auth session failed');
        }
      });
    }, 3000);
  }

  private stopDeviceLoginPolling(): void {
    if (this.authSessionPollTimer !== null) {
      window.clearTimeout(this.authSessionPollTimer);
      this.authSessionPollTimer = null;
    }
  }

  private loadAuthStatus(id: string): void {
    this.authLoading = true;
    this.loadingService.track(this.codexAgentService.getAuthStatus(id)).pipe(finalize(() => (this.authLoading = false))).subscribe({
      next: (status) => {
        this.authStatus = status;
      },
      error: () => {
        this.authStatus = null;
        this.toastService.error('Load auth status failed');
      }
    });
  }

  private createInitialValue(): CodexAgentCreateDto {
    const initialValue = JSON.parse(JSON.stringify(CODEX_AGENT_INITIAL_VALUE)) as CodexAgentCreateDto;
    if (this.options?.defaults) {
      initialValue.model = this.options.defaults.model || initialValue.model || '';
      initialValue.reasoningEffort = this.options.defaults.reasoningEffort || initialValue.reasoningEffort;
      initialValue.sandboxMode = this.options.defaults.sandboxMode || initialValue.sandboxMode;
      initialValue.approvalPolicy = this.options.defaults.approvalPolicy || initialValue.approvalPolicy;
    }
    return initialValue;
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toSelectOptions(items: CodexAgentOptionItemResponse[] | undefined): { label: string; value: string }[] {
    return (items ?? []).map((item) => ({ label: item.label, value: item.value }));
  }

  private hasNumber(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private formatLocalDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(date);
  }

  private relativeTimeToNow(value: string): string {
    const date = new Date(value);
    const diffMs = date.getTime() - Date.now();
    if (Number.isNaN(date.getTime())) {
      return 'invalid time';
    }
    if (diffMs <= 0) {
      return 'expired';
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || parts.length === 0) {
      parts.push(`${minutes}m`);
    }

    return `in ${parts.join(' ')}`;
  }
}

function optionsOrEmpty(items: CodexAgentOptionItemResponse[] | undefined) {
  return items ?? [];
}
