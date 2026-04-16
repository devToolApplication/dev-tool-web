import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import {
  PlaywrightSessionResponse,
  PlaywrightSessionStatus,
  PlaywrightSessionUpsertRequest
} from '../../../../core/models/ai-agent/playwright.model';
import { PlaywrightAdminService } from '../../../../core/services/ai-agent-service/playwright-admin.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';

type SessionAction = 'reset' | 'enable' | 'disable';
type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

const DEFAULT_TEMPORARY_CHAT_URL = 'https://chatgpt.com/?temporary-chat=true';

@Component({
  selector: 'app-playwright-session-management',
  standalone: false,
  templateUrl: './playwright-session-management.component.html',
  styleUrl: './playwright-session-management.component.css'
})
export class PlaywrightSessionManagementComponent implements OnInit {
  sessions: PlaywrightSessionResponse[] = [];
  loading = false;
  saving = false;
  syncing = false;
  formVisible = false;
  editMode = false;
  selectedSession: PlaywrightSessionResponse | null = null;
  actionLoadingKey = '';
  formModel: PlaywrightSessionUpsertRequest = this.createEmptyForm();

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

  openCreate(): void {
    this.editMode = false;
    this.selectedSession = null;
    this.formModel = this.createEmptyForm();
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
      timeoutMs: session.timeoutMs || 180000
    };
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editMode = false;
    this.selectedSession = null;
    this.formModel = this.createEmptyForm();
  }

  onFormVisibleChange(visible: boolean): void {
    this.formVisible = visible;
    if (!visible) {
      this.closeForm();
    }
  }

  saveSession(): void {
    const payload = this.normalizeFormPayload();
    if (!payload) {
      return;
    }

    const request$ = this.editMode
      ? this.playwrightAdminService.updateSession(this.selectedSession?.sessionId || payload.sessionId, payload)
      : this.playwrightAdminService.createSession(payload);

    this.saving = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.toastService.success(this.editMode ? 'Updated Playwright session' : 'Created Playwright session');
        this.closeForm();
        this.loadSessions();
      },
      error: () => this.toastService.error(this.editMode ? 'Update Playwright session failed' : 'Create Playwright session failed')
    });
  }

  syncDefaultSession(): void {
    this.syncing = true;
    this.loadingService.track(this.playwrightAdminService.syncDefaultSession()).pipe(finalize(() => (this.syncing = false))).subscribe({
      next: () => {
        this.toastService.success('Synced default Playwright session');
        this.loadSessions();
      },
      error: () => this.toastService.error('Sync default Playwright session failed')
    });
  }

  runSessionAction(session: PlaywrightSessionResponse, action: SessionAction): void {
    if (!session.sessionId || this.isActionLoading(session, action)) {
      return;
    }

    if (action === 'disable' && !window.confirm(`Disable Playwright session "${session.sessionId}"?`)) {
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
    this.loading = true;
    this.loadingService.track(this.playwrightAdminService.listSessions()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (sessions) => {
        this.sessions = [...sessions].sort((left, right) => (left.sessionId || '').localeCompare(right.sessionId || ''));
      },
      error: () => this.toastService.error('Load Playwright sessions failed')
    });
  }

  isActionLoading(session: PlaywrightSessionResponse, action: SessionAction): boolean {
    return this.actionLoadingKey === `${session.sessionId}:${action}`;
  }

  statusLabel(status?: PlaywrightSessionStatus): string {
    switch (status) {
      case 'IDLE':
        return 'Rảnh';
      case 'BUSY':
        return 'Đang xử lý';
      case 'HUNG':
        return 'Treo';
      case 'DISABLED':
        return 'Tắt';
      default:
        return 'Không rõ';
    }
  }

  statusSeverity(status?: PlaywrightSessionStatus): TagSeverity {
    switch (status) {
      case 'IDLE':
        return 'success';
      case 'BUSY':
        return 'info';
      case 'HUNG':
        return 'danger';
      case 'DISABLED':
        return 'secondary';
      default:
        return 'warn';
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

  private normalizeFormPayload(): PlaywrightSessionUpsertRequest | null {
    const sessionId = this.formModel.sessionId?.trim();
    const cdpEndpoint = this.formModel.cdpEndpoint?.trim();
    if (!sessionId) {
      this.toastService.error('Session ID is required');
      return null;
    }
    if (!cdpEndpoint) {
      this.toastService.error('CDP endpoint is required');
      return null;
    }

    const timeoutMs = Number(this.formModel.timeoutMs || 0);
    return {
      sessionId,
      name: this.formModel.name?.trim() || sessionId,
      cdpEndpoint,
      temporaryChatUrl: this.formModel.temporaryChatUrl?.trim() || DEFAULT_TEMPORARY_CHAT_URL,
      enabled: this.formModel.enabled !== false,
      timeoutMs: timeoutMs > 0 ? timeoutMs : 180000
    };
  }

  private createEmptyForm(): PlaywrightSessionUpsertRequest {
    return {
      sessionId: '',
      name: '',
      cdpEndpoint: '',
      temporaryChatUrl: DEFAULT_TEMPORARY_CHAT_URL,
      enabled: true,
      timeoutMs: 180000
    };
  }

  private countByStatus(status: PlaywrightSessionStatus): number {
    return this.sessions.filter((session) => session.status === status).length;
  }

  private actionSuccessMessage(action: SessionAction): string {
    switch (action) {
      case 'reset':
        return 'Reset Playwright session thành rảnh';
      case 'enable':
        return 'Enabled Playwright session';
      case 'disable':
        return 'Disabled Playwright session';
    }
  }

  private actionErrorMessage(action: SessionAction): string {
    switch (action) {
      case 'reset':
        return 'Reset Playwright session failed';
      case 'enable':
        return 'Enable Playwright session failed';
      case 'disable':
        return 'Disable Playwright session failed';
    }
  }
}
