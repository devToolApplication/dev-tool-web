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
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import type { KocCampaignDetail, KocRejectionReasonSummary } from '../../model/koc-campaign.model';
import type { KocCandidateSummary } from '../../model/koc-candidate.model';
import type { KocExecutionStatus } from '../../model/koc-common.model';
import type { KocDiscoveryStrategySummary } from '../../model/koc-discovery.model';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { KocDiscoveryApiService } from '../../services/koc-discovery-api.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';

type KocCampaignDetailTab = 'overview' | 'discovery' | 'candidates' | 'rules' | 'activity';
type KocCampaignFunnelKey =
  | 'discovered'
  | 'unique'
  | 'screened'
  | 'rejected'
  | 'review'
  | 'accepted'
  | 'waiting';

interface KocCampaignFunnelItem {
  key: KocCampaignFunnelKey;
  label: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-koc-campaign-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-detail.component.html',
  styleUrl: './campaign-detail.component.css',
})
export class CampaignDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignApi = inject(KocCampaignApiService);
  private readonly discoveryApi = inject(KocDiscoveryApiService);
  private readonly candidateApi = inject(KocCandidateApiService);
  private readonly realtime = inject(KocRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly permissionService = inject(PermissionService);

  readonly campaignId = signal(this.route.snapshot.paramMap.get('campaignId') ?? '');
  readonly campaign = signal<KocCampaignDetail | null>(null);
  readonly strategies = signal<KocDiscoveryStrategySummary[]>([]);
  readonly candidates = signal<KocCandidateSummary[]>([]);
  readonly loading = signal(false);
  readonly startingStrategyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<KocCampaignDetailTab>(
    normalizeTab(this.route.snapshot.queryParamMap.get('tab')),
  );

  readonly canEdit = computed(() => this.permissionService.has('AI_AGENT_WORKFLOW_WRITE'));

  readonly tabs: { id: KocCampaignDetailTab; label: string }[] = [
    { id: 'overview', label: 'koc.campaignDetail.tab.overview' },
    { id: 'discovery', label: 'koc.campaignDetail.tab.discovery' },
    { id: 'candidates', label: 'koc.campaignDetail.tab.candidates' },
    { id: 'rules', label: 'koc.campaignDetail.tab.rules' },
    { id: 'activity', label: 'koc.campaignDetail.tab.activity' },
  ];

  readonly funnelItems = computed<KocCampaignFunnelItem[]>(() => {
    const counters = this.campaign()?.counters;
    if (!counters) {
      return [];
    }
    const max = Math.max(1, counters.discovered, counters.unique, counters.screened);
    return [
      funnelItem('discovered', counters.discovered, max),
      funnelItem('unique', counters.unique, max),
      funnelItem('screened', counters.screened, max),
      funnelItem('rejected', counters.rejected, max),
      funnelItem('review', counters.review, max),
      funnelItem(
        'accepted',
        counters.accepted,
        Math.max(1, this.campaign()?.acceptedTarget ?? max),
      ),
      funnelItem('waiting', counters.waiting, max),
    ];
  });

  readonly topRejectionReasons = computed<KocRejectionReasonSummary[]>(
    () => this.campaign()?.topRejectionReasons ?? [],
  );

  ngOnInit(): void {
    void this.loadCampaignRuntime();
    this.connectRealtime();
  }

  async loadCampaignRuntime(): Promise<void> {
    const campaignId = this.campaignId();
    if (!campaignId) {
      this.error.set('koc.campaignDetail.error.missingCampaign');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        forkJoin({
          campaign: this.campaignApi.getCampaign(campaignId),
          strategies: this.discoveryApi.getCampaignStrategies(campaignId),
          candidates: this.candidateApi.getCandidatePage({ campaignId, page: 0, size: 5 }),
        }),
      );
      this.campaign.set(response.campaign);
      this.strategies.set(response.strategies);
      this.candidates.set(response.candidates.data);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: KocCampaignDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  openFunnelFilter(key: KocCampaignFunnelKey): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/candidates'], {
      queryParams: {
        campaignId: this.campaignId(),
        ...funnelFilter(key),
      },
    });
  }

  openRejectionReason(reason: string): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/candidates'], {
      queryParams: {
        campaignId: this.campaignId(),
        decision: 'REJECTED',
        rejectReason: reason,
      },
    });
  }

  openCandidate(candidate: KocCandidateSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/candidates', candidate.candidateId]);
  }

  async startDiscoveryStrategy(strategy: KocDiscoveryStrategySummary): Promise<void> {
    if (!this.canEdit() || this.startingStrategyId()) {
      return;
    }
    this.startingStrategyId.set(strategy.strategyId);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.discoveryApi.startDiscoveryRun(this.campaignId(), strategy.strategyId),
      );
      await this.loadCampaignRuntime();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.startingStrategyId.set(null);
    }
  }

  openCandidates(): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/candidates'], {
      queryParams: { campaignId: this.campaignId() },
    });
  }

  isLowYield(strategy: KocDiscoveryStrategySummary): boolean {
    return (
      strategy.yieldRate < 0.2 ||
      strategy.duplicateCandidates > Math.max(1, strategy.newCandidates * 2)
    );
  }

  formatYield(value: number): string {
    const normalized = value <= 1 ? value * 100 : value;
    return `${Math.round(normalized)}%`;
  }

  tabPanelId(tabId: KocCampaignDetailTab): string {
    return `campaign-detail-tabpanel-${tabId}`;
  }

  progressPercent(): number {
    const campaign = this.campaign();
    if (!campaign) {
      return 0;
    }
    return Math.min(
      100,
      Math.round((campaign.counters.accepted / Math.max(1, campaign.acceptedTarget)) * 100),
    );
  }

  private connectRealtime(): void {
    this.realtime
      .connect({ reconnect: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.aggregateId === this.campaignId()) {
          void this.loadCampaignRuntime();
        }
      });
  }
}

function funnelItem(key: KocCampaignFunnelKey, value: number, max: number): KocCampaignFunnelItem {
  return {
    key,
    label: `koc.campaignDetail.funnel.${key}`,
    value,
    percent: Math.min(100, Math.round((value / Math.max(1, max)) * 100)),
  };
}

function funnelFilter(key: KocCampaignFunnelKey): {
  decision?: string;
  executionStatus?: KocExecutionStatus;
} {
  switch (key) {
    case 'accepted':
      return { decision: 'ACCEPTED' };
    case 'rejected':
      return { decision: 'REJECTED' };
    case 'review':
      return { decision: 'REVIEW' };
    case 'waiting':
      return { executionStatus: 'WAITING' };
    default:
      return {};
  }
}

function normalizeTab(tab: string | null): KocCampaignDetailTab {
  return ['overview', 'discovery', 'candidates', 'rules', 'activity'].includes(tab ?? '')
    ? (tab as KocCampaignDetailTab)
    : 'overview';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.campaignDetail.error.loadFailed';
}
