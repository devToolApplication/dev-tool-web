import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CodexAgentAuthStatusResponse, CodexDeviceLoginSessionResponse } from '../../../../core/models/codex-agent/codex-agent-auth.model';
import { CodexAgentAdminService } from '../../../../core/services/codex-agent-service/codex-agent-admin.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';

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
      error: () => this.toastService.error('codexAgent.login.toast.loadAuthStatusFailed')
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
      error: () => this.toastService.error('codexAgent.login.toast.startDeviceLoginFailed')
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
          this.toastService.error('codexAgent.login.toast.refreshSessionFailed');
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
      this.toastService.error('codexAgent.login.toast.clipboardUnavailable');
      return;
    }

    navigator.clipboard.writeText(userCode).then(() => {
      this.toastService.success('codexAgent.login.toast.userCodeCopied');
    }).catch(() => {
      this.toastService.error('codexAgent.login.toast.copyUserCodeFailed');
    });
  }

  get authStatusLabel(): string {
    if (!this.authStatus) {
      return 'codexAgent.login.status.unknown';
    }

    return this.authStatus.authenticated ? 'codexAgent.login.status.authenticated' : 'codexAgent.login.status.notAuthenticated';
  }

  get authStatusClass(): string {
    return this.authStatus?.authenticated ? 'success' : 'warning';
  }

  get sessionStateLabel(): string {
    return this.session?.state ? `codexAgent.login.sessionState.${this.session.state}` : 'codexAgent.login.sessionState.noSession';
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

  private handleSessionStateChange(session: CodexDeviceLoginSessionResponse, previousState?: string, started = false): void {
    if (started) {
      this.toastService.info('codexAgent.login.toast.sessionReady');
    }

    if (session.state === previousState) {
      return;
    }

    if (session.state === 'authenticated') {
      this.toastService.success('codexAgent.login.toast.loginCompleted');
      this.loadAuthStatus();
      return;
    }

    if (session.state === 'failed') {
      this.toastService.error(session.message || 'codexAgent.login.toast.loginFailed');
      this.loadAuthStatus();
      return;
    }

    if (session.state === 'expired') {
      this.toastService.error(session.message || 'codexAgent.login.toast.loginExpired');
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
