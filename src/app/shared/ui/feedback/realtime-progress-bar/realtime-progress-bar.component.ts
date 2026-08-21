import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ProgressStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ProgressState {
  id: string;
  title?: string;
  status: ProgressStatus;
  percent?: number;
  current?: number;
  total?: number;
  step?: string;
  message?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  cancellable?: boolean;
}

type LegacyProgressState = {
  taskId?: string;
  taskType?: string;
  status?: string;
  progressPercent?: number;
  current?: number;
  total?: number;
  step?: string;
  message?: string;
  errorMessage?: string;
};

@Component({
  selector: 'app-realtime-progress-bar',
  standalone: false,
  templateUrl: './realtime-progress-bar.component.html',
  styleUrl: './realtime-progress-bar.component.css'
})
export class RealtimeProgressBarComponent {
  @Input() state?: ProgressState | LegacyProgressState | null;
  @Input() showCancel = false;
  @Input() showDetails = true;
  @Output() cancel = new EventEmitter<void>();
  @Output() viewDetail = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  normalized(): ProgressState | null {
    if (!this.state) {
      return null;
    }

    const legacy = this.state as LegacyProgressState;
    const current = this.state as ProgressState;
    return {
      id: current.id ?? legacy.taskId ?? '',
      title: current.title ?? legacy.taskType,
      status: this.normalizeStatus(current.status ?? legacy.status),
      percent: current.percent ?? legacy.progressPercent,
      current: current.current ?? legacy.current,
      total: current.total ?? legacy.total,
      step: current.step ?? legacy.step,
      message: current.message ?? legacy.message,
      errorMessage: current.errorMessage ?? legacy.errorMessage,
      cancellable: current.cancellable
    };
  }

  percent(): number {
    return Math.min(100, Math.max(0, Number(this.normalized()?.percent ?? 0)));
  }

  indeterminate(): boolean {
    const state = this.normalized();
    return !!state && state.status === 'running' && state.percent == null;
  }

  canCancel(): boolean {
    const state = this.normalized();
    return this.showCancel && !!state && (state.cancellable ?? true) && !['completed', 'failed', 'cancelled'].includes(state.status);
  }

  statusVariant(status: ProgressStatus): 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted' {
    switch (status) {
      case 'queued':
        return 'info';
      case 'running':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'muted';
      case 'idle':
      default:
        return 'default';
    }
  }

  private normalizeStatus(status: string | undefined): ProgressStatus {
    switch ((status ?? 'idle').toLowerCase()) {
      case 'queued':
      case 'pending':
        return 'queued';
      case 'running':
      case 'in_progress':
      case 'syncing':
        return 'running';
      case 'completed':
      case 'success':
      case 'succeeded':
      case 'skipped':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'idle':
      default:
        return 'idle';
    }
  }
}
