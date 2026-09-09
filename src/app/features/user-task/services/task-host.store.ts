import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { isTaskScreenValid, TaskScreenAdapter } from '../models/task-screen-adapter.model';
import {
  UserTaskActionRequest,
  UserTaskActionResponse,
  UserTaskDetail,
  UserTaskHistoryItem,
  UserTaskSummary,
} from '../models/user-task.model';
import { TaskScreenRegistry } from '../registry/task-screen.registry';
import { UserTaskApiService } from './user-task-api.service';

export type TaskHostState =
  | 'LOADING'
  | 'AUTO_CLAIMING'
  | 'READY'
  | 'READ_ONLY'
  | 'UNSUPPORTED'
  | 'FORBIDDEN'
  | 'CONFIRMING'
  | 'SUBMITTING'
  | 'COMPLETED';

export interface BackendErrorInfo {
  errorCode: string;
  errorMessage: string;
  status?: number;
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
  );
  return `{${pairs.join(',')}}`;
}

export function extractBackendErrorInfo(
  err: unknown,
  fallbackMessage = 'userTask.error.actionFailed',
): BackendErrorInfo {
  if (!err || typeof err !== 'object') {
    return { errorCode: 'UNKNOWN_ERROR', errorMessage: fallbackMessage };
  }

  const httpErr = err as {
    status?: number;
    error?: {
      code?: string;
      errorCode?: string;
      message?: string;
      errorMessage?: string;
    } | string;
    message?: string;
  };

  const status = httpErr.status;
  let errorCode = '';
  let errorMessage = '';

  if (typeof httpErr.error === 'object' && httpErr.error !== null) {
    errorCode = httpErr.error.errorCode || httpErr.error.code || '';
    errorMessage = httpErr.error.errorMessage || httpErr.error.message || '';
  } else if (typeof httpErr.error === 'string') {
    try {
      const parsed = JSON.parse(httpErr.error);
      errorCode = parsed.errorCode || parsed.code || '';
      errorMessage = parsed.errorMessage || parsed.message || '';
    } catch {
      errorMessage = httpErr.error;
    }
  }

  if (!errorCode) {
    if (status === 403) errorCode = 'FORBIDDEN';
    else if (status === 404) errorCode = 'USER_TASK_NOT_FOUND';
    else if (status === 409) errorCode = 'TASK_ACTION_CONFLICT';
    else if (status === 422) errorCode = 'UNSUPPORTED_TASK_FORM_KEY';
    else errorCode = status ? `HTTP_${status}` : 'UNKNOWN_ERROR';
  }

  if (!errorMessage) {
    if (status === 403) errorMessage = 'userTask.error.forbidden';
    else if (status === 404) errorMessage = 'userTask.error.loadFailed';
    else errorMessage = httpErr.message || fallbackMessage;
  }

  return { errorCode, errorMessage, status };
}

@Injectable()
export class TaskHostStore {
  private readonly apiService = inject(UserTaskApiService);
  private readonly registry = inject(TaskScreenRegistry);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly router = inject(Router);
  private readonly claimedTaskIds = new Set<string>();
  private loadSequence = 0;

  readonly state = signal<TaskHostState>('LOADING');
  readonly detail = signal<UserTaskDetail | null>(null);
  readonly history = signal<UserTaskHistoryItem[]>([]);
  readonly historyLoading = signal<boolean>(false);
  readonly historyError = signal<string | null>(null);
  readonly historyErrorCode = signal<string | null>(null);
  readonly comment = signal<string>('');
  readonly currentRequestId = signal<string | null>(null);
  readonly lastSubmissionFingerprint = signal<string | null>(null);
  readonly activeAction = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);
  readonly commentError = signal<string | null>(null);
  readonly claimAttempted = signal<boolean>(false);
  readonly adapter = signal<TaskScreenAdapter | null>(null);

  readonly task = computed<UserTaskSummary | null>(() => this.detail()?.task ?? null);
  readonly formKey = computed<string>(() => this.task()?.formKey ?? '');
  readonly taskId = computed<string>(() => this.task()?.taskId ?? '');

  readonly isSupported = computed<boolean>(() => {
    const d = this.detail();
    if (!d) return false;
    return d.supported && this.registry.isSupported(d.task?.formKey);
  });

  readonly isCompleted = computed<boolean>(() => {
    const t = this.task();
    return !!t?.completed;
  });

  readonly isReadOnly = computed<boolean>(() => {
    const s = this.state();
    return s === 'READ_ONLY' || s === 'COMPLETED' || s === 'UNSUPPORTED';
  });

  readonly isLoading = computed<boolean>(() => {
    const s = this.state();
    return s === 'LOADING' || s === 'AUTO_CLAIMING';
  });

  readonly isSubmitting = computed<boolean>(() => this.state() === 'SUBMITTING');
  readonly isConfirming = computed<boolean>(() => this.state() === 'CONFIRMING');
  readonly isReady = computed<boolean>(() => this.state() === 'READY');

  readonly allowedActions = computed<string[]>(() => {
    const s = this.state();
    if (s === 'READ_ONLY' || s === 'UNSUPPORTED' || s === 'FORBIDDEN' || s === 'COMPLETED') {
      return [];
    }
    return this.detail()?.allowedActions ?? this.task()?.allowedActions ?? [];
  });

  readonly liveAnnouncement = computed<string>(() => {
    switch (this.state()) {
      case 'LOADING':
        return 'userTask.live.loading';
      case 'AUTO_CLAIMING':
        return 'userTask.live.autoClaiming';
      case 'READY':
        return 'userTask.live.ready';
      case 'READ_ONLY':
        return 'userTask.live.readOnly';
      case 'UNSUPPORTED':
        return 'userTask.live.unsupported';
      case 'FORBIDDEN':
        return 'userTask.live.forbidden';
      case 'CONFIRMING':
        return 'userTask.live.confirming';
      case 'SUBMITTING':
        return 'userTask.live.submitting';
      case 'COMPLETED':
        return 'userTask.live.completed';
    }
  });

  private canUserAct(detail: UserTaskDetail | null): boolean {
    if (!detail) return false;
    const taskCanAct = detail.task?.canAct !== false;
    const permCanAct = detail.permission?.canAct !== false;
    const notReadOnly = !detail.task?.readOnly && !detail.permission?.readOnly;
    const notCompleted = !detail.task?.completed;
    const actions = detail.allowedActions ?? detail.task?.allowedActions ?? [];
    return taskCanAct && permCanAct && notReadOnly && notCompleted && actions.length > 0;
  }

  async load(taskId: string): Promise<void> {
    const loadId = ++this.loadSequence;
    if (!taskId || !taskId.trim()) {
      this.detail.set(null);
      this.history.set([]);
      this.adapter.set(null);
      this.state.set('READ_ONLY');
      this.errorCode.set('INVALID_TASK_ID');
      this.error.set('userTask.error.loadFailed');
      return;
    }

    this.state.set('LOADING');
    this.detail.set(null);
    this.history.set([]);
    this.adapter.set(null);
    this.error.set(null);
    this.errorCode.set(null);
    this.historyError.set(null);
    this.historyErrorCode.set(null);
    this.commentError.set(null);
    this.claimAttempted.set(this.claimedTaskIds.has(taskId));
    this.currentRequestId.set(null);
    this.lastSubmissionFingerprint.set(null);
    this.comment.set('');
    this.activeAction.set(null);

    this.historyLoading.set(true);
    const detailPromise = firstValueFrom(this.apiService.getTask(taskId));
    const historyPromise = firstValueFrom(this.apiService.getTaskHistory(taskId))
      .then((history) => {
        if (loadId !== this.loadSequence) return;
        this.history.set(history || []);
        this.historyError.set(null);
        this.historyErrorCode.set(null);
        this.historyLoading.set(false);
      })
      .catch((histErr) => {
        if (loadId !== this.loadSequence) return;
        const errInfo = extractBackendErrorInfo(histErr, 'userTask.error.historyLoadFailed');
        this.history.set([]);
        this.historyErrorCode.set(errInfo.errorCode);
        this.historyError.set(errInfo.errorMessage);
        this.historyLoading.set(false);
        this.toastService.error(errInfo.errorCode, errInfo.errorMessage);
      });

    try {
      const detail = await detailPromise;
      if (loadId !== this.loadSequence) return;
      this.detail.set(detail);
      await this.evaluateLoadedState(taskId, detail, loadId);
    } catch (err: unknown) {
      if (loadId !== this.loadSequence) return;
      this.historyLoading.set(false);
      this.handleLoadError(err);
    }

    await historyPromise;
  }

  private async evaluateLoadedState(
    taskId: string,
    detail: UserTaskDetail,
    loadId: number,
  ): Promise<void> {
    if (!detail.supported || !this.registry.isSupported(detail.task?.formKey)) {
      this.state.set('UNSUPPORTED');
      return;
    }

    if (detail.task?.completed) {
      this.state.set('COMPLETED');
      return;
    }

    const isClaimable = !!(detail.task?.claimable || detail.permission?.claimable);
    if (isClaimable && !this.claimedTaskIds.has(taskId)) {
      await this.triggerAutoClaim(taskId, loadId);
      return;
    }

    if (!this.canUserAct(detail)) {
      this.state.set('READ_ONLY');
      return;
    }

    this.state.set('READY');
  }

  private async triggerAutoClaim(taskId: string, loadId: number): Promise<void> {
    this.claimedTaskIds.add(taskId);
    this.claimAttempted.set(true);
    this.state.set('AUTO_CLAIMING');

    try {
      await firstValueFrom(this.apiService.claimTask(taskId));
      const freshDetail = await firstValueFrom(this.apiService.getTask(taskId));
      if (loadId !== this.loadSequence) return;
      this.detail.set(freshDetail);

      try {
        const freshHistory = await firstValueFrom(this.apiService.getTaskHistory(taskId));
        if (loadId !== this.loadSequence) return;
        this.history.set(freshHistory || []);
        this.historyError.set(null);
        this.historyErrorCode.set(null);
      } catch (histErr) {
        const errInfo = extractBackendErrorInfo(histErr, 'userTask.error.historyLoadFailed');
        this.historyErrorCode.set(errInfo.errorCode);
        this.historyError.set(errInfo.errorMessage);
        this.toastService.error(errInfo.errorCode, errInfo.errorMessage);
      }

      if (!freshDetail.supported || !this.registry.isSupported(freshDetail.task?.formKey)) {
        this.state.set('UNSUPPORTED');
      } else if (freshDetail.task?.completed) {
        this.state.set('COMPLETED');
      } else if (!this.canUserAct(freshDetail)) {
        this.state.set('READ_ONLY');
      } else {
        this.state.set('READY');
      }
    } catch (err: unknown) {
      if (loadId !== this.loadSequence) return;
      try {
        const freshDetail = await firstValueFrom(this.apiService.getTask(taskId));
        if (loadId !== this.loadSequence) return;
        this.detail.set(freshDetail);
        if (!freshDetail.supported || !this.registry.isSupported(freshDetail.task?.formKey)) {
          this.state.set('UNSUPPORTED');
        } else if (freshDetail.task?.completed) {
          this.state.set('COMPLETED');
        } else if (!this.canUserAct(freshDetail)) {
          this.state.set('READ_ONLY');
        } else {
          this.state.set('READY');
        }
      } catch {
        this.state.set('READ_ONLY');
      }

      const errInfo = extractBackendErrorInfo(err, 'userTask.error.conflict');
      this.errorCode.set(errInfo.errorCode);
      this.error.set(errInfo.errorMessage);
      this.toastService.error(errInfo.errorCode, errInfo.errorMessage);
    }
  }

  setComment(comment: string): void {
    this.comment.set(comment);
    this.commentError.set(null);
  }

  registerAdapter(adapter: TaskScreenAdapter): void {
    this.adapter.set(adapter);
  }

  unregisterAdapter(adapter?: TaskScreenAdapter): void {
    if (!adapter || this.adapter() === adapter) {
      this.adapter.set(null);
    }
  }

  validate(action: string): { valid: boolean; errorMessage?: string } {
    if (!this.allowedActions().includes(action)) {
      return { valid: false, errorMessage: 'userTask.error.actionFailed' };
    }

    const commentVal = this.comment().trim();
    if ((action === 'REJECT' || action === 'RETURN') && !commentVal) {
      return { valid: false, errorMessage: 'userTask.confirm.commentRequired' };
    }

    if (this.comment().length > 2000) {
      return { valid: false, errorMessage: 'userTask.comment.maxLength' };
    }

    const currentAdapter = this.adapter();
    if (currentAdapter) {
      const res = isTaskScreenValid(currentAdapter.validate(action));
      if (!res.valid) {
        return {
          valid: false,
          errorMessage: res.errorMessage || 'userTask.error.validationFailed',
        };
      }
    }

    return { valid: true };
  }

  async initiateAction(action: string): Promise<boolean> {
    if (this.state() !== 'READY') {
      return false;
    }

    const validation = this.validate(action);
    if (!validation.valid) {
      this.commentError.set(validation.errorMessage || null);
      this.toastService.error('error', validation.errorMessage || 'userTask.error.validationFailed');
      return false;
    }

    this.state.set('CONFIRMING');
    this.activeAction.set(action);

    const isDestructive = action === 'REJECT' || action === 'STOP';
    const confirmed = await this.confirmDialogService.confirm({
      title: 'userTask.confirm.title',
      message: 'userTask.confirm.message',
      confirmText: 'userTask.actions.submit',
      cancelText: 'userTask.actions.cancel',
      variant: isDestructive ? 'danger' : 'default',
    });

    if (!confirmed) {
      this.state.set('READY');
      this.activeAction.set(null);
      return false;
    }

    return this.executeSubmit(action);
  }

  async executeSubmit(action: string): Promise<boolean> {
    const variables = this.adapter()?.buildVariables(action) ?? {};
    const currentFingerprint =
      `${action}::${stableStringify(variables)}::${this.comment().trim()}`;

    if (this.lastSubmissionFingerprint() === currentFingerprint && this.currentRequestId()) {
      // Retain existing requestId for retry of identical submission
    } else {
      this.currentRequestId.set(crypto.randomUUID());
      this.lastSubmissionFingerprint.set(currentFingerprint);
    }

    this.state.set('SUBMITTING');
    this.activeAction.set(action);
    this.error.set(null);
    this.errorCode.set(null);

    const request: UserTaskActionRequest = {
      requestId: this.currentRequestId()!,
      action,
      variables,
      comment: this.comment().trim() || undefined,
    };

    try {
      await firstValueFrom(this.apiService.submitAction(this.taskId(), request));
      this.state.set('COMPLETED');
      this.toastService.success('userTask.success.action');
      await this.router.navigate(['/tasks']);
      return true;
    } catch (err: unknown) {
      this.state.set('READY');
      this.activeAction.set(null);
      const errInfo = extractBackendErrorInfo(err, 'userTask.error.actionFailed');
      this.errorCode.set(errInfo.errorCode);
      this.error.set(errInfo.errorMessage);
      this.toastService.error(errInfo.errorCode, errInfo.errorMessage);
      return false;
    }
  }

  private handleLoadError(err: unknown): void {
    const errInfo = extractBackendErrorInfo(err, 'userTask.error.loadFailed');
    if (errInfo.status === 403) {
      this.state.set('FORBIDDEN');
    } else {
      this.state.set('READ_ONLY');
    }

    this.errorCode.set(errInfo.errorCode);
    this.error.set(errInfo.errorMessage);
    this.toastService.error(errInfo.errorCode, errInfo.errorMessage);
  }
}
