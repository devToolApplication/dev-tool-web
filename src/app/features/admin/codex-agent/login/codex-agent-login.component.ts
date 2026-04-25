import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CodexAgentAuthStatusResponse, CodexDeviceLoginSessionResponse } from '../../../../core/models/codex-agent/codex-agent-auth.model';
import { CodexAgentAdminService } from '../../../../core/services/codex-agent-service/codex-agent-admin.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
  selector: 'app-codex-agent-login',
  standalone: false,
  templateUrl: './codex-agent-login.component.html',
  styleUrl: './codex-agent-login.component.css'
})
export class CodexAgentLoginComponent implements OnInit, OnDestroy {
  loadingStatus = false;
  startingLogin = false;
  refreshingSession = false;
  authStatus: CodexAgentAuthStatusResponse | null = null;
  session: CodexDeviceLoginSessionResponse | null = null;

  private pollTimerId: number | null = null;

  constructor(
    private readonly codexAgentAdminService: CodexAgentAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAuthStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadAuthStatus(): void {
    this.loadingStatus = true;
    this.loadingService.track(this.codexAgentAdminService.getAuthStatus()).pipe(finalize(() => (this.loadingStatus = false))).subscribe({
      next: (response) => {
        this.authStatus = response;
      },
      error: () => this.toastService.error('Load Codex auth status failed')
    });
  }

  startDeviceLogin(): void {
    this.startingLogin = true;
    this.loadingService.track(this.codexAgentAdminService.startDeviceLogin()).pipe(finalize(() => (this.startingLogin = false))).subscribe({
      next: (session) => {
        const previousState = this.session?.state;
        this.session = session;
        this.syncPolling();
        this.handleSessionStateChange(session, previousState, true);
      },
      error: () => this.toastService.error('Start Codex device login failed')
    });
  }

  refreshSession(showToastOnError = true): void {
    const sessionId = this.session?.sessionId;
    if (!sessionId) {
      return;
    }

    this.refreshingSession = true;
    this.loadingService.track(this.codexAgentAdminService.getDeviceLoginSession(sessionId)).pipe(finalize(() => (this.refreshingSession = false))).subscribe({
      next: (session) => {
        const previousState = this.session?.state;
        this.session = session;
        this.syncPolling();
        this.handleSessionStateChange(session, previousState);
      },
      error: () => {
        if (showToastOnError) {
          this.toastService.error('Refresh Codex device login session failed');
        }
      }
    });
  }

  openVerificationLink(): void {
    if (!this.session?.verificationUri) {
      return;
    }

    window.open(this.session.verificationUri, '_blank', 'noopener,noreferrer');
  }

  copyUserCode(): void {
    const userCode = this.session?.userCode;
    if (!userCode) {
      return;
    }

    if (!navigator.clipboard) {
      this.toastService.error('Clipboard is not available in this browser');
      return;
    }

    navigator.clipboard.writeText(userCode).then(() => {
      this.toastService.success('User code copied');
    }).catch(() => {
      this.toastService.error('Copy user code failed');
    });
  }

  get authStatusLabel(): string {
    if (!this.authStatus) {
      return 'UNKNOWN';
    }

    return this.authStatus.authenticated ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED';
  }

  get authStatusClass(): string {
    return this.authStatus?.authenticated ? 'success' : 'warning';
  }

  get authStatusSeverity(): TagSeverity {
    return this.authStatus?.authenticated ? 'success' : 'warn';
  }

  get sessionStateLabel(): string {
    return this.session?.state?.toUpperCase() || 'NO_SESSION';
  }

  get sessionStateClass(): string {
    switch (this.session?.state) {
      case 'authenticated':
        return 'success';
      case 'failed':
      case 'expired':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  get sessionStateSeverity(): TagSeverity {
    switch (this.session?.state) {
      case 'authenticated':
        return 'success';
      case 'failed':
      case 'expired':
        return 'danger';
      case 'pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  private handleSessionStateChange(session: CodexDeviceLoginSessionResponse, previousState?: string, started = false): void {
    if (started) {
      this.toastService.info('Device login session is ready. Open the verification link and enter the code.');
    }

    if (session.state === previousState) {
      return;
    }

    if (session.state === 'authenticated') {
      this.toastService.success('Codex device login completed');
      this.loadAuthStatus();
      return;
    }

    if (session.state === 'failed') {
      this.toastService.error(session.message || 'Codex device login failed');
      this.loadAuthStatus();
      return;
    }

    if (session.state === 'expired') {
      this.toastService.error(session.message || 'Codex device login expired');
      this.loadAuthStatus();
    }
  }

  private syncPolling(): void {
    if (this.session?.state === 'pending') {
      this.startPolling();
      return;
    }

    this.stopPolling();
  }

  private startPolling(): void {
    if (this.pollTimerId !== null) {
      return;
    }

    this.pollTimerId = window.setInterval(() => {
      this.refreshSession(false);
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollTimerId === null) {
      return;
    }

    window.clearInterval(this.pollTimerId);
    this.pollTimerId = null;
  }
}
