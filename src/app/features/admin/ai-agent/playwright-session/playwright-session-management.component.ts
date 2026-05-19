import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  PlaywrightSessionResponse,
  PlaywrightSessionStatus,
  PlaywrightSessionUpsertRequest
} from '../../../../core/models/ai-agent/playwright.model';
import { PlaywrightAdminService } from '../../../../core/services/ai-agent-service/playwright-admin.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { BadgeVariant } from '../../../../shared/ui/data-display/badge/badge.component';
import { FormInput } from '../../../../shared/ui/form-input/form-input';
import { FormConfig, FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../shared/ui/form-input/utils/validation-rules';
import { ActionToolbarAction } from '../../../../shared/ui/layout/action-toolbar/action-toolbar.component';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';
import { toUniqueTextOptions } from '../../../form-option-utils';

type SessionAction = 'reset' | 'enable' | 'disable';

const DEFAULT_TEMPORARY_CHAT_URL = 'https://chatgpt.com/?temporary-chat=true';

@Component({
  selector: 'app-playwright-session-management',
  standalone: false,
  templateUrl: './playwright-session-management.component.html',
  styleUrl: './playwright-session-management.component.css'
})
export class PlaywrightSessionManagementComponent implements OnInit {
  @ViewChild(FormInput) private readonly sessionForm?: FormInput;

  sessions: PlaywrightSessionResponse[] = [];
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly syncing = signal(false);
  formVisible = false;
  editMode = false;
  selectedSession: PlaywrightSessionResponse | null = null;
  actionLoadingKey = '';
  readonly loadError = signal('');
  formApiError = '';
  formModel: PlaywrightSessionUpsertRequest = this.createEmptyForm();
  formContext: FormContext = { user: null, mode: 'create', extra: {} };

  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'sessionId',
        label: 'aiAgent.playwrightSessions.sessionId',
        placeholder: 'chrome-1',
        required: true,
        disabledWhen: 'context.mode === "edit"',
        validation: [Rules.required('aiAgent.playwrightSessions.validation.sessionIdRequired')]
      },
      {
        type: 'text',
        name: 'name',
        label: 'name',
        placeholder: 'Chrome CDP 1'
      },
      {
        type: 'auto-complete',
        name: 'cdpEndpoint',
        label: 'aiAgent.playwrightSessions.cdpEndpoint',
        placeholder: 'http://127.0.0.1:9222',
        width: 'full',
        required: true,
        optionsExpression: 'context.extra?.cdpEndpointOptions || []',
        validation: [Rules.required('aiAgent.playwrightSessions.validation.cdpEndpointRequired')]
      },
      {
        type: 'auto-complete',
        name: 'temporaryChatUrl',
        label: 'aiAgent.playwrightSessions.temporaryChatUrl',
        placeholder: DEFAULT_TEMPORARY_CHAT_URL,
        width: 'full',
        optionsExpression: 'context.extra?.temporaryChatUrlOptions || []'
      },
      {
        type: 'number',
        name: 'timeoutMs',
        label: 'aiAgent.playwrightSessions.leaseTimeoutMs',
        suffix: ' ms',
        validation: [Rules.min(1000, 'aiAgent.playwrightSessions.validation.timeoutMin')]
      },
      {
        type: 'number',
        name: 'minIdleBeforeReuseMs',
        label: 'aiAgent.playwrightSessions.minIdleBeforeReuseMs',
        suffix: ' ms',
        validation: [Rules.min(0, 'aiAgent.playwrightSessions.validation.nonNegative')]
      },
      {
        type: 'number',
        name: 'globalMinStartIntervalMs',
        label: 'aiAgent.playwrightSessions.globalStartIntervalMs',
        suffix: ' ms',
        validation: [Rules.min(0, 'aiAgent.playwrightSessions.validation.nonNegative')]
      },
      {
        type: 'boolean',
        name: 'enabled',
        label: 'enabled'
      }
    ]
  };

  readonly tableConfig: TableConfig = {
    title: 'aiAgent.playwrightSessions.listTitle',
    stateKey: 'ai-agent.playwright-sessions',
    emptyTitle: 'aiAgent.playwrightSessions.emptyTitle',
    emptyDescription: 'aiAgent.playwrightSessions.empty',
    errorTitle: 'aiAgent.playwrightSessions.loadErrorTitle',
    toolbar: {
      refresh: { visible: true, label: 'refresh', icon: 'pi pi-refresh', severity: 'secondary' },
      columnVisibility: { visible: true },
      density: { visible: true },
      export: {
        visible: true,
        label: 'shared.table.exportCurrentPage',
        icon: 'pi pi-download',
        severity: 'help',
        scope: 'current-page',
        fileName: 'playwright-sessions'
      }
    },
    columns: [
      {
        field: 'session',
        header: 'aiAgent.playwrightSessions.session',
        type: 'custom',
        customTemplateKey: 'session',
        minWidth: '18rem',
        hideable: false
      },
      {
        field: 'status',
        header: 'status',
        type: 'custom',
        customTemplateKey: 'status',
        minWidth: '13rem'
      },
      {
        field: 'cdpEndpoint',
        header: 'aiAgent.playwrightSessions.cdpEndpoint',
        type: 'custom',
        customTemplateKey: 'endpoint',
        minWidth: '22rem'
      },
      {
        field: 'timeoutMs',
        header: 'timeout',
        type: 'custom',
        customTemplateKey: 'throttle',
        minWidth: '16rem'
      },
      {
        field: 'currentThread',
        header: 'aiAgent.playwrightSessions.currentThread',
        type: 'custom',
        customTemplateKey: 'thread',
        minWidth: '14rem'
      },
      {
        field: 'timeline',
        header: 'aiAgent.playwrightSessions.timeline',
        type: 'custom',
        customTemplateKey: 'timeline',
        minWidth: '18rem'
      },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '14rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          {
            id: 'edit',
            label: 'edit',
            icon: 'pi pi-pencil',
            severity: 'info',
            showLabel: false,
            tooltip: 'edit',
            onClick: (row) => this.openEdit(row)
          },
          {
            id: 'reset',
            label: 'aiAgent.playwrightSessions.reset',
            icon: 'pi pi-replay',
            severity: 'help',
            showLabel: false,
            tooltip: 'aiAgent.playwrightSessions.reset',
            disabled: (row) => row.status === 'BUSY' || this.isActionLoading(row, 'reset'),
            onClick: (row) => this.runSessionAction(row, 'reset')
          },
          {
            id: 'enable',
            label: 'aiAgent.playwrightSessions.enable',
            icon: 'pi pi-check',
            severity: 'success',
            showLabel: false,
            tooltip: 'aiAgent.playwrightSessions.enable',
            visible: (row) => row.enabled === false || row.status === 'DISABLED',
            disabled: (row) => this.isActionLoading(row, 'enable'),
            onClick: (row) => this.runSessionAction(row, 'enable')
          },
          {
            id: 'disable',
            label: 'aiAgent.playwrightSessions.disable',
            icon: 'pi pi-ban',
            severity: 'danger',
            variant: 'danger',
            showLabel: false,
            tooltip: 'aiAgent.playwrightSessions.disable',
            confirm: { message: 'aiAgent.playwrightSessions.confirmDisable', variant: 'danger' },
            visible: (row) => row.enabled !== false && row.status !== 'DISABLED',
            disabled: (row) => row.status === 'BUSY' || this.isActionLoading(row, 'disable'),
            onClick: (row) => this.runSessionAction(row, 'disable')
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [10, 20, 50],
    density: 'compact',
    scrollable: true,
    scrollHeight: 'flex',
    minWidth: '116rem'
  };

  constructor(
    private readonly playwrightAdminService: PlaywrightAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  get totalCount(): number {
    return this.sessions.length;
  }

  get idleCount(): number {
    return this.countByStatus('IDLE');
  }

  get busyCount(): number {
    return this.countByStatus('BUSY');
  }

  get hungCount(): number {
    return this.countByStatus('HUNG');
  }

  get pageActions(): ActionToolbarAction[] {
    return [
      {
        id: 'refresh',
        label: 'refresh',
        icon: 'pi pi-refresh',
        variant: 'ghost',
        placement: 'secondary',
        loading: this.loading(),
        disabled: this.loading()
      },
      {
        id: 'sync-default',
        label: 'aiAgent.playwrightSessions.syncDefault',
        icon: 'pi pi-sync',
        variant: 'default',
        placement: 'secondary',
        loading: this.syncing(),
        disabled: this.syncing()
      },
      {
        id: 'new',
        label: 'aiAgent.playwrightSessions.newSession',
        icon: 'pi pi-plus',
        variant: 'primary',
        placement: 'primary'
      }
    ];
  }

  get formTitle(): string {
    return this.editMode ? 'aiAgent.playwrightSessions.editSession' : 'aiAgent.playwrightSessions.newSession';
  }

  get formSubtitle(): string {
    return this.editMode ? (this.selectedSession?.sessionId || '') : 'aiAgent.playwrightSessions.formDescription';
  }

  onPageAction(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'refresh':
        this.loadSessions();
        return;
      case 'sync-default':
        this.syncDefaultSession();
        return;
      case 'new':
        this.openCreate();
        return;
    }
  }

  openCreate(): void {
    this.editMode = false;
    this.selectedSession = null;
    this.formModel = this.createEmptyForm();
    this.formContext = { user: null, mode: 'create', extra: this.formContext.extra ?? {} };
    this.formApiError = '';
    this.formVisible = true;
  }

  openEdit(session: PlaywrightSessionResponse): void {
    this.editMode = true;
    this.selectedSession = session;
    this.formModel = {
      sessionId: session.sessionId,
      name: session.name || '',
      cdpEndpoint: session.cdpEndpoint || '',
      temporaryChatUrl: session.temporaryChatUrl || DEFAULT_TEMPORARY_CHAT_URL,
      enabled: session.enabled !== false,
      timeoutMs: session.timeoutMs || 180000,
      minIdleBeforeReuseMs: session.minIdleBeforeReuseMs ?? 15000,
      globalMinStartIntervalMs: session.globalMinStartIntervalMs ?? 5000
    };
    this.formContext = { user: null, mode: 'edit', extra: this.formContext.extra ?? {} };
    this.formApiError = '';
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editMode = false;
    this.selectedSession = null;
    this.formModel = this.createEmptyForm();
    this.formContext = { user: null, mode: 'create', extra: this.formContext.extra ?? {} };
    this.formApiError = '';
  }

  onFormVisibleChange(visible: boolean): void {
    this.formVisible = visible;
    if (!visible) {
      this.closeForm();
    }
  }

  submitSessionForm(): void {
    this.sessionForm?.onSubmit();
  }

  saveSession(model: PlaywrightSessionUpsertRequest): void {
    const payload = this.normalizeFormPayload(model);
    if (!payload) {
      return;
    }

    const request$ = this.editMode
      ? this.playwrightAdminService.updateSession(this.selectedSession?.sessionId || payload.sessionId, payload)
      : this.playwrightAdminService.createSession(payload);

    this.saving.set(true);
    this.formApiError = '';
    this.loadingService.track(request$).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toastService.success(this.editMode ? 'aiAgent.playwrightSessions.toast.updated' : 'aiAgent.playwrightSessions.toast.created');
        this.closeForm();
        this.loadSessions();
      },
      error: () => {
        this.formApiError = this.editMode ? 'aiAgent.playwrightSessions.toast.updateFailed' : 'aiAgent.playwrightSessions.toast.createFailed';
        this.toastService.error(this.formApiError);
      }
    });
  }

  syncDefaultSession(): void {
    this.syncing.set(true);
    this.loadingService.track(this.playwrightAdminService.syncDefaultSession()).pipe(finalize(() => this.syncing.set(false))).subscribe({
      next: () => {
        this.toastService.success('aiAgent.playwrightSessions.toast.syncedDefault');
        this.loadSessions();
      },
      error: () => this.toastService.error('aiAgent.playwrightSessions.toast.syncDefaultFailed')
    });
  }

  runSessionAction(session: PlaywrightSessionResponse, action: SessionAction): void {
    if (!session.sessionId || this.isActionLoading(session, action)) {
      return;
    }

    this.actionLoadingKey = `${session.sessionId}:${action}`;
    const request$ = action === 'reset'
      ? this.playwrightAdminService.resetSession(session.sessionId)
      : action === 'enable'
        ? this.playwrightAdminService.enableSession(session.sessionId)
        : this.playwrightAdminService.disableSession(session.sessionId);

    this.loadingService.track(request$).pipe(finalize(() => (this.actionLoadingKey = ''))).subscribe({
      next: () => {
        this.toastService.success(this.actionSuccessMessage(action));
        this.loadSessions();
      },
      error: () => this.toastService.error(this.actionErrorMessage(action))
    });
  }

  loadSessions(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.loadingService.track(this.playwrightAdminService.listSessions()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (sessions) => {
        this.sessions = [...sessions].sort((left, right) => (left.sessionId || '').localeCompare(right.sessionId || ''));
        this.updateFormOptions();
      },
      error: () => {
        this.loadError.set('aiAgent.playwrightSessions.toast.loadFailed');
        this.toastService.error('aiAgent.playwrightSessions.toast.loadFailed');
      }
    });
  }

  isActionLoading(session: PlaywrightSessionResponse, action: SessionAction): boolean {
    return this.actionLoadingKey === `${session.sessionId}:${action}`;
  }

  statusLabel(status?: PlaywrightSessionStatus): string {
    switch (status) {
      case 'IDLE':
        return 'aiAgent.playwrightSessions.status.idle';
      case 'BUSY':
        return 'aiAgent.playwrightSessions.status.busy';
      case 'HUNG':
        return 'aiAgent.playwrightSessions.status.hung';
      case 'DISABLED':
        return 'aiAgent.playwrightSessions.status.disabled';
      default:
        return 'aiAgent.playwrightSessions.status.unknown';
    }
  }

  statusSeverity(status?: PlaywrightSessionStatus): BadgeVariant {
    switch (status) {
      case 'IDLE':
        return 'success';
      case 'BUSY':
        return 'info';
      case 'HUNG':
        return 'danger';
      case 'DISABLED':
        return 'muted';
      default:
        return 'warning';
    }
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  formatTimeout(timeoutMs?: number): string {
    if (!timeoutMs || timeoutMs <= 0) {
      return '-';
    }

    if (timeoutMs < 1000) {
      return `${timeoutMs} ms`;
    }

    const seconds = Math.round(timeoutMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return remainSeconds ? `${minutes}m ${remainSeconds}s` : `${minutes}m`;
  }

  threadDisplay(session: PlaywrightSessionResponse): string {
    if (!session.currentThreadName && !session.currentThreadId) {
      return '-';
    }
    return `${session.currentThreadName || 'thread'}${session.currentThreadId ? ` #${session.currentThreadId}` : ''}`;
  }

  trackBySessionId(_: number, session: PlaywrightSessionResponse): string {
    return session.sessionId;
  }

  private normalizeFormPayload(model: PlaywrightSessionUpsertRequest): PlaywrightSessionUpsertRequest | null {
    const sessionId = model.sessionId?.trim();
    const cdpEndpoint = model.cdpEndpoint?.trim();
    if (!sessionId) {
      this.toastService.error('aiAgent.playwrightSessions.validation.sessionIdRequired');
      return null;
    }
    if (!cdpEndpoint) {
      this.toastService.error('aiAgent.playwrightSessions.validation.cdpEndpointRequired');
      return null;
    }

    const timeoutMs = Number(model.timeoutMs || 0);
    const minIdleBeforeReuseMs = Number(model.minIdleBeforeReuseMs ?? 15000);
    const globalMinStartIntervalMs = Number(model.globalMinStartIntervalMs ?? 5000);
    return {
      sessionId,
      name: model.name?.trim() || sessionId,
      cdpEndpoint,
      temporaryChatUrl: model.temporaryChatUrl?.trim() || DEFAULT_TEMPORARY_CHAT_URL,
      enabled: model.enabled !== false,
      timeoutMs: timeoutMs > 0 ? timeoutMs : 180000,
      minIdleBeforeReuseMs: minIdleBeforeReuseMs >= 0 ? minIdleBeforeReuseMs : 15000,
      globalMinStartIntervalMs: globalMinStartIntervalMs >= 0 ? globalMinStartIntervalMs : 5000
    };
  }

  private createEmptyForm(): PlaywrightSessionUpsertRequest {
    return {
      sessionId: '',
      name: '',
      cdpEndpoint: '',
      temporaryChatUrl: DEFAULT_TEMPORARY_CHAT_URL,
      enabled: true,
      timeoutMs: 180000,
      minIdleBeforeReuseMs: 15000,
      globalMinStartIntervalMs: 5000
    };
  }

  private countByStatus(status: PlaywrightSessionStatus): number {
    return this.sessions.filter((session) => session.status === status).length;
  }

  private updateFormOptions(): void {
    const temporaryChatOptions = [
      { label: DEFAULT_TEMPORARY_CHAT_URL, value: DEFAULT_TEMPORARY_CHAT_URL },
      ...toUniqueTextOptions(this.sessions, (session) => session.temporaryChatUrl)
        .filter((option) => option.value !== DEFAULT_TEMPORARY_CHAT_URL)
    ];

    this.formContext = {
      ...this.formContext,
      extra: {
        ...(this.formContext.extra ?? {}),
        cdpEndpointOptions: toUniqueTextOptions(this.sessions, (session) => session.cdpEndpoint),
        temporaryChatUrlOptions: temporaryChatOptions
      }
    };
  }

  private actionSuccessMessage(action: SessionAction): string {
    switch (action) {
      case 'reset':
        return 'aiAgent.playwrightSessions.toast.resetSuccess';
      case 'enable':
        return 'aiAgent.playwrightSessions.toast.enableSuccess';
      case 'disable':
        return 'aiAgent.playwrightSessions.toast.disableSuccess';
    }
  }

  private actionErrorMessage(action: SessionAction): string {
    switch (action) {
      case 'reset':
        return 'aiAgent.playwrightSessions.toast.resetFailed';
      case 'enable':
        return 'aiAgent.playwrightSessions.toast.enableFailed';
      case 'disable':
        return 'aiAgent.playwrightSessions.toast.disableFailed';
    }
  }
}
