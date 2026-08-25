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
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import {
  buildKocDashboardMetrics,
  deriveKocDashboardState,
} from '../../model/koc-dashboard-view.model';
import {
  KocDashboardApiService,
  type KocDashboardData,
} from '../../services/koc-dashboard-api.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';

@Component({
  selector: 'app-koc-dashboard',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './koc-dashboard.component.html',
  styleUrl: './koc-dashboard.component.css',
})
export class KocDashboardComponent implements OnInit {
  private readonly api = inject(KocDashboardApiService);
  private readonly realtime = inject(KocRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly dashboard = signal<KocDashboardData | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly realtimeConnected = signal(true);
  readonly metrics = computed(() => buildKocDashboardMetrics(this.dashboard()));
  readonly state = computed(() =>
    deriveKocDashboardState({
      data: this.dashboard(),
      loading: this.loading(),
      error: this.error(),
      realtimeConnected: this.realtimeConnected(),
    }),
  );
  readonly dependencyHealth = computed(() => this.dashboard()?.dependencyHealth ?? []);
  readonly attentionItems = computed(() => this.dashboard()?.attentionItems ?? []);
  readonly campaignProgress = computed(() => this.dashboard()?.campaignProgress ?? []);
  readonly status = computed(() => this.pageStatus());

  ngOnInit(): void {
    void this.loadDashboard();
    this.connectRealtime();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.dashboard.set(await firstValueFrom(this.api.getDashboard()));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  createCampaign(): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns/create']);
  }

  private connectRealtime(): void {
    this.realtime
      .connect({ reconnect: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.realtimeConnected.set(true);
          void this.loadDashboard();
        },
        error: () => this.realtimeConnected.set(false),
        complete: () => this.realtimeConnected.set(false),
      });
  }

  private pageStatus(): { label: string; variant: BadgeVariant; icon: string } {
    const state = this.state();
    if (state.activeIncident) {
      return {
        label: 'koc.dashboard.status.incident',
        variant: 'danger',
        icon: 'pi pi-exclamation-triangle',
      };
    }
    if (state.realtimeDisconnected || state.partialMetrics) {
      return { label: 'koc.dashboard.status.attention', variant: 'warning', icon: 'pi pi-wifi' };
    }
    if (state.healthy) {
      return {
        label: 'koc.dashboard.status.healthy',
        variant: 'success',
        icon: 'pi pi-check-circle',
      };
    }
    return { label: 'koc.dashboard.status.ready', variant: 'info', icon: 'pi pi-chart-line' };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.dashboard.error.loadFailed';
}
