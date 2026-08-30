import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, type PageMetadata } from '@core/http/base-response.model';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import type { SelectValue } from '@shared/ui/primitives/select/select';
import {
  KOC_CAMPAIGN_STATUS_OPTIONS,
  buildKocCampaignTableConfig,
  parseKocCampaignListQuery,
  serializeKocCampaignListQuery,
} from '../../model/koc-campaign-list.config';
import type { KocCampaignListQuery, KocCampaignStatus, KocCampaignSummary } from '../../model/koc-campaign.model';
import { KocCampaignApiService } from '../../services/koc-campaign-api.service';

@Component({
  selector: 'app-koc-campaign-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-list.component.html',
  styleUrl: './campaign-list.component.css',
})
export class CampaignListComponent implements OnInit {
  private readonly api = inject(KocCampaignApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly query = signal<KocCampaignListQuery>({ page: 0, size: 20 });
  readonly campaigns = signal<KocCampaignSummary[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusOptions = KOC_CAMPAIGN_STATUS_OPTIONS;
  readonly tableConfig = buildKocCampaignTableConfig();

  ngOnInit(): void {
    const query = parseKocCampaignListQuery(this.route.snapshot.queryParamMap);
    this.query.set({
      page: query.page ?? 0,
      size: query.size ?? 20,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
    });
    void this.loadCampaigns();
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.campaigns().length;
  }

  currentPage(): number {
    return this.metadata().currentPage ?? this.metadata().pageNumber ?? this.query().page ?? 0;
  }

  rows(): number {
    return this.metadata().size ?? this.metadata().pageSize ?? this.query().size ?? 20;
  }

  async loadCampaigns(page = this.query().page ?? 0, size = this.query().size ?? 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const nextQuery = { ...this.query(), page, size };
    this.query.set(nextQuery);

    try {
      const response = await firstValueFrom(this.api.getCampaignPage(nextQuery));
      this.campaigns.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(filters: Record<string, unknown>): void {
    this.navigateWithQuery({
      ...this.query(),
      search: typeof filters['search'] === 'string' ? filters['search'] : undefined,
      page: 0,
      size: this.query().size ?? this.rows(),
    });
  }

  onStatusFilter(value: SelectValue): void {
    this.navigateWithQuery({
      ...this.query(),
      status: normalizeStatusValue(value),
      page: 0,
      size: this.query().size ?? this.rows(),
    });
  }

  onPageChange(event: { page: number; rows: number }): void {
    this.navigateWithQuery({
      ...this.query(),
      page: event.page,
      size: event.rows,
    });
  }

  openCampaign(row: KocCampaignSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns', row.campaignId]);
  }

  onTableAction(event: { action: TableAction<KocCampaignSummary>; row: KocCampaignSummary }): void {
    const actionId = event.action.id;
    if (actionId) {
      this.handleRowAction(actionId, event.row);
    }
  }

  private navigateWithQuery(query: KocCampaignListQuery): void {
    this.query.set(query);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeKocCampaignListQuery(query),
    });
  }

  private handleRowAction(actionId: string, row: KocCampaignSummary): void {
    switch (actionId) {
      case 'open':
        this.openCampaign(row);
        break;
      case 'pause':
        void this.runLifecycleAction(this.api.pauseCampaign(row.campaignId));
        break;
      case 'resume':
        void this.runLifecycleAction(this.api.resumeCampaign(row.campaignId));
        break;
      case 'clone':
        void this.runLifecycleAction(this.api.cloneCampaign(row.campaignId));
        break;
      case 'stop':
        void this.runLifecycleAction(this.api.stopCampaign(row.campaignId));
        break;
      default:
        break;
    }
  }

  private async runLifecycleAction(request: ReturnType<KocCampaignApiService['pauseCampaign']>): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(request);
      await this.loadCampaigns(this.currentPage(), this.rows());
    } catch (error) {
      this.error.set(errorMessage(error));
      this.loading.set(false);
    }
  }
}

function normalizeStatusValue(value: SelectValue): KocCampaignStatus | undefined {
  const statuses: KocCampaignStatus[] = ['DRAFT', 'READY', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED', 'BLOCKED'];
  return typeof value === 'string' && statuses.includes(value as KocCampaignStatus) ? value as KocCampaignStatus : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.campaigns.error.loadFailed';
}
