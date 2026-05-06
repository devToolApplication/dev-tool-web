import { Component, DestroyRef, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
        label: 'code',
        width: '1/2',
        validation: [Rules.required('codexAgent.form.validation.codeRequired')],
        helpText: 'codexAgent.form.help.code'
      },
      {
        type: 'text',
        name: 'name',
        label: 'name',
        width: '1/2',
        validation: [Rules.required('codexAgent.form.validation.nameRequired')],
        helpText: 'codexAgent.form.help.name'
      },
      { type: 'select', name: 'model', label: 'codexAgent.form.model', width: '1/2', optionsExpression: 'context.extra?.modelOptions || []' },
      {
        type: 'select',
        name: 'reasoningEffort',
        label: 'codexAgent.form.reasoningEffort',
        width: '1/2',
        optionsExpression: 'context.extra?.reasoningEffortOptions || []'
      },
      {
        type: 'select',
        name: 'sandboxMode',
        label: 'codexAgent.form.sandboxMode',
        width: '1/2',
        optionsExpression: 'context.extra?.sandboxModeOptions || []'
      },
      {
        type: 'select',
        name: 'approvalPolicy',
        label: 'codexAgent.form.approvalPolicy',
        width: '1/2',
        optionsExpression: 'context.extra?.approvalPolicyOptions || []'
      },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/3' },
      { type: 'select', name: 'status', label: 'status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'text', name: 'installationId', label: 'codexAgent.form.installationId', width: '1/3', helpText: 'codexAgent.form.help.installationId' },
      { type: 'textarea', name: 'description', label: 'description', width: 'full', helpText: 'codexAgent.form.help.description' },
      { type: 'textarea', name: 'instruction', label: 'codexAgent.form.agentsInstruction', width: 'full', showZoomButton: true, helpText: 'codexAgent.form.help.instruction' },
      {
        type: 'textarea',
        name: 'authJson',
        label: 'codexAgent.form.authJson',
        width: 'full',
        showZoomButton: true,
        contentType: 'json',
        jsonValidationMessage: 'codexAgent.form.validation.invalidJson',
        helpText: 'codexAgent.form.help.authJson'
      }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  readonly authLoading = signal(false);
  readonly authDeviceLoading = signal(false);
  readonly syncLoading = signal(false);
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
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  ngOnDestroy(): void {
    this.stopDeviceLoginPolling();
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editId ? 'codexAgent.form.editTitle' : 'codexAgent.form.createTitle',
      description: 'codexAgent.form.description',
      actions: [
        { id: 'back', label: 'codexAgent.form.back', icon: 'pi pi-arrow-left', goBack: true },
        ...(this.editId
          ? [{ id: 'sync-home', label: 'codexAgent.form.syncHome', icon: 'pi pi-refresh', loading: this.syncLoading() }]
          : []),
        { id: 'save', label: this.editId ? 'update' : 'create', icon: 'pi pi-save', submitForm: true, loading: this.loading() }
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

    this.loading.set(true);
    this.loadingService
      .track(request$)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (saved) => {
          this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
          void this.router.navigate([`${CODEX_AGENT_ROUTES.list}/edit`, saved.id]);
        },
        error: () => this.toastService.error('codexAgent.form.toast.saveFailed')
      });
  }

  onActionClick(actionId: string): void {
    if (actionId !== 'sync-home' || !this.editId) {
      return;
    }

    this.syncLoading.set(true);
    this.loadingService
      .track(this.codexAgentService.syncHome(this.editId))
      .pipe(
        finalize(() => this.syncLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          this.toastService.info(this.interpolate('codexAgent.form.toast.syncHomeSuccess', { path: result.agentHome }));
          this.loadAuthStatus(this.editId!);
        },
        error: () => this.toastService.error('codexAgent.form.toast.syncHomeFailed')
      });
  }

  startDeviceAuth(): void {
    if (!this.editId) {
      return;
    }

    this.authDeviceLoading.set(true);
    this.stopDeviceLoginPolling();
    this.loadingService
      .track(this.codexAgentService.startDeviceLogin(this.editId))
      .pipe(
        finalize(() => this.authDeviceLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (session) => {
          this.deviceLoginSession = session;
          this.toastService.info('codexAgent.form.toast.deviceAuthCreated');
          this.handleDeviceLoginSession(this.editId!, session);
        },
        error: () => this.toastService.error('codexAgent.form.toast.startDeviceAuthFailed')
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
      return 'codexAgent.form.auth.notConfigured';
    }
    return this.authStatus.authenticated ? 'codexAgent.form.auth.authenticated' : 'codexAgent.form.auth.expired';
  }

  authStatusSeverity(): 'success' | 'warn' | 'danger' | 'info' {
    if (!this.authStatus?.configured) {
      return 'warn';
    }
    return this.authStatus.authenticated ? 'success' : 'danger';
  }

  displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'notAvailable';
    }
    return String(value);
  }

  usageCounter(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window) {
      return this.i18nService.t('notAvailable');
    }
    if (this.hasNumber(window.remaining) && this.hasNumber(window.limit)) {
      return `${window.remaining} / ${window.limit}`;
    }
    if (this.hasNumber(window.remainingPercent)) {
      return this.interpolate('codexAgent.form.usage.percentLeft', { percent: window.remainingPercent });
    }
    if (this.hasNumber(window.usedPercent)) {
      return this.interpolate('codexAgent.form.usage.percentUsed', { percent: window.usedPercent });
    }
    if (this.hasNumber(window.remaining)) {
      return String(window.remaining);
    }
    if (this.hasNumber(window.limit)) {
      return this.interpolate('codexAgent.form.usage.limitOnly', { limit: window.limit });
    }
    return this.i18nService.t('notAvailable');
  }

  usageReset(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window) {
      return this.i18nService.t('notAvailable');
    }
    if (window.resetAt) {
      return `${this.formatLocalDateTime(window.resetAt)} (${this.relativeTimeToNow(window.resetAt)})`;
    }
    if (window.windowHours) {
      return this.interpolate('codexAgent.form.usage.rollingWindowHours', { hours: window.windowHours });
    }
    return this.i18nService.t(window.resetMode || 'unknown');
  }

  usageWindowLabel(window: CodexAgentUsageWindowResponse | undefined): string {
    if (!window?.windowHours) {
      return this.i18nService.t('codexAgent.form.usage.windowUnknown');
    }
    if (window.windowHours % 24 === 0) {
      return this.interpolate('codexAgent.form.usage.windowDays', { days: Math.round(window.windowHours / 24) });
    }
    return this.interpolate('codexAgent.form.usage.windowHours', { hours: window.windowHours });
  }

  fieldDescription(key: string): string {
    return this.optionDescriptions[key] || 'notAvailable';
  }

  optionDescription(list: CodexAgentOptionItemResponse[] | undefined, value: string | undefined | null): string {
    if (!value || !list?.length) {
      return 'notAvailable';
    }
    return list.find((item) => item.value === value)?.description || 'notAvailable';
  }

  onFormValueChange(value: Partial<CodexAgentCreateDto>): void {
    this.currentFormValue = value ?? {};
  }

  fieldGuideFields(): FieldGuideFieldItem[] {
    return [
      { key: 'model', label: 'codexAgent.form.model', description: this.fieldDescription('model') },
      { key: 'reasoningEffort', label: 'codexAgent.form.reasoningEffort', description: this.fieldDescription('reasoningEffort') },
      { key: 'sandboxMode', label: 'codexAgent.form.sandboxMode', description: this.fieldDescription('sandboxMode') },
      { key: 'approvalPolicy', label: 'codexAgent.form.approvalPolicy', description: this.fieldDescription('approvalPolicy') }
    ];
  }

  fieldGuideSelections(): FieldGuideOptionItem[] {
    return [
      {
        title: 'codexAgent.form.selectedModel',
        description: this.optionDescription(optionsOrEmpty(this.options?.models), this.currentFormValue.model ?? this.formInitialValue.model)
      },
      {
        title: 'codexAgent.form.selectedReasoningEffort',
        description: this.optionDescription(optionsOrEmpty(this.options?.reasoningEfforts), this.currentFormValue.reasoningEffort ?? this.formInitialValue.reasoningEffort)
      },
      {
        title: 'codexAgent.form.selectedSandboxMode',
        description: this.optionDescription(optionsOrEmpty(this.options?.sandboxModes), this.currentFormValue.sandboxMode ?? this.formInitialValue.sandboxMode)
      },
      {
        title: 'codexAgent.form.selectedApprovalPolicy',
        description: this.optionDescription(optionsOrEmpty(this.options?.approvalPolicies), this.currentFormValue.approvalPolicy ?? this.formInitialValue.approvalPolicy)
      }
    ];
  }

  private loadOptions(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.codexAgentService.getOptions())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
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
          this.toastService.error('codexAgent.form.toast.loadOptionsFailed');
          this.bindRouteMode();
        }
      });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
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
    this.loading.set(true);
    this.loadingService
      .track(this.codexAgentService.getById(id))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
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
          this.toastService.error('codexAgent.form.toast.loadDetailFailed');
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
      this.toastService.info('codexAgent.form.toast.deviceAuthCompleted');
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
      this.loadingService
        .track(this.codexAgentService.getDeviceLoginSession(id, sessionId))
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (session) => {
            this.deviceLoginSession = session;
            this.handleDeviceLoginSession(id, session);
          },
          error: () => {
            this.stopDeviceLoginPolling();
            this.toastService.error('codexAgent.form.toast.loadDeviceAuthSessionFailed');
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
    this.authLoading.set(true);
    this.loadingService
      .track(this.codexAgentService.getAuthStatus(id))
      .pipe(
        finalize(() => this.authLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (status) => {
          this.authStatus = status;
        },
        error: () => {
          this.authStatus = null;
          this.toastService.error('codexAgent.form.toast.loadAuthStatusFailed');
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
      return this.i18nService.t('codexAgent.form.usage.invalidTime');
    }
    if (diffMs <= 0) {
      return this.i18nService.t('codexAgent.form.usage.expired');
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

    return this.interpolate('codexAgent.form.usage.relativeFuture', { duration: parts.join(' ') });
  }

  private interpolate(key: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
      (message, [name, value]) => message.split(`{{${name}}}`).join(String(value)),
      this.i18nService.t(key)
    );
  }
}

function optionsOrEmpty(items: CodexAgentOptionItemResponse[] | undefined) {
  return items ?? [];
}
