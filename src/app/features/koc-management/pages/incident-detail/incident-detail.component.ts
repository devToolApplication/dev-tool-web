import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { KocIncidentDetail, KocRecoveryProgress } from '../../model/koc-incident.model';
import { KocIncidentApiService } from '../../services/koc-incident-api.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';

@Component({
  selector: 'app-koc-incident-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-detail.component.html',
  styleUrl: './incident-detail.component.css',
})
export class IncidentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(KocIncidentApiService);
  private readonly realtime = inject(KocRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly permissionService = inject(PermissionService);

  readonly incidentId = signal(this.route.snapshot.paramMap.get('incidentId') ?? '');
  readonly incident = signal<KocIncidentDetail | null>(null);
  readonly recoveryProgress = signal<KocRecoveryProgress | null>(null);
  readonly loading = signal(false);
  readonly testing = signal(false);
  readonly fixing = signal(false);
  readonly error = signal<string | null>(null);

  readonly canOperate = computed(() =>
    this.permissionService.hasAny(['AI_AGENT_EXECUTE', 'AI_AGENT_WORKFLOW_WRITE']),
  );

  readonly impactItems = computed<KeyValueItem[]>(() => {
    const item = this.incident();
    if (!item) {
      return [];
    }
    return [
      { label: 'koc.incident.detail.dependencyKey', value: item.dependencyKey },
      { label: 'koc.incident.detail.errorCode', value: item.stableErrorCode },
      { label: 'koc.incident.detail.waitingWorkflows', value: item.waitingWorkflows },
      { label: 'koc.incident.detail.affectedCampaigns', value: item.affectedCampaigns },
    ];
  });

  readonly recoveryItems = computed<
    { key: keyof KocRecoveryProgress; label: string; value: number }[]
  >(() => {
    const progress = this.recoveryProgress();
    if (!progress) {
      return [];
    }
    return [
      {
        key: 'recovered',
        label: 'koc.incidentDetail.recovery.recovered',
        value: progress.recovered,
      },
      { key: 'running', label: 'koc.incidentDetail.recovery.running', value: progress.running },
      { key: 'queued', label: 'koc.incidentDetail.recovery.queued', value: progress.queued },
      { key: 'failed', label: 'koc.incidentDetail.recovery.failed', value: progress.failed },
    ];
  });

  ngOnInit(): void {
    void this.loadIncident();
    this.connectRealtime();
  }

  async loadIncident(): Promise<void> {
    const incidentId = this.incidentId();
    if (!incidentId) {
      this.error.set('koc.incidentDetail.error.missingIncident');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.api.getIncident(incidentId));
      this.incident.set(data);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async testDependency(): Promise<void> {
    const incidentId = this.incidentId();
    if (!incidentId || !this.canOperate()) {
      return;
    }

    this.testing.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.testDependency(incidentId));
      this.incident.set(updated);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.testing.set(false);
    }
  }

  async markIssueFixed(): Promise<void> {
    const incidentId = this.incidentId();
    if (!incidentId || !this.canOperate()) {
      return;
    }

    this.fixing.set(true);
    this.error.set(null);
    try {
      const progress = await firstValueFrom(this.api.markIssueFixed(incidentId));
      this.recoveryProgress.set(progress);
      const current = this.incident();
      if (current) {
        this.incident.set({ ...current, status: 'RECOVERING' });
      }
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.fixing.set(false);
    }
  }

  private connectRealtime(): void {
    this.realtime
      .connect({ reconnect: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (
          event.aggregateId === this.incidentId() ||
          event.aggregateId === this.incident()?.dependencyKey
        ) {
          void this.loadIncident();
        }
      });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.incidentDetail.error.loadFailed';
}
