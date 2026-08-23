import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, type PageMetadata } from '@core/http/base-response.model';
import type { KocIncidentListQuery, KocIncidentStatus, KocIncidentSummary } from '../../model/koc-incident.model';
import { KocIncidentApiService } from '../../services/koc-incident-api.service';

const INCIDENT_STATUSES: KocIncidentStatus[] = ['BLOCKED', 'RECOVERING', 'HEALTHY', 'OPEN', 'RESOLVED'];

@Component({
  selector: 'app-koc-incident-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-list.component.html',
  styleUrl: './incident-list.component.css',
})
export class IncidentListComponent implements OnInit {
  private readonly api = inject(KocIncidentApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly query = signal<KocIncidentListQuery>({ page: 0, size: 20, status: 'BLOCKED' });
  readonly incidents = signal<KocIncidentSummary[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.query.set(parseIncidentQuery(this.route.snapshot.queryParamMap));
    void this.loadIncidents();
  }

  async loadIncidents(page = this.query().page ?? 0, size = this.query().size ?? 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const nextQuery = { ...this.query(), page, size };
    this.query.set(nextQuery);
    try {
      const response = await firstValueFrom(this.api.getIncidentPage(nextQuery));
      this.incidents.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  activeBanner(): KocIncidentSummary | null {
    return this.incidents().find((incident) => incident.status === 'BLOCKED' || incident.status === 'OPEN') ?? null;
  }

  openIncident(incident: KocIncidentSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/incidents', incident.incidentId]);
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.incidents().length;
  }
}

function parseIncidentQuery(query: Pick<ParamMap, 'get'>): KocIncidentListQuery {
  const status = query.get('status');
  return {
    ...(INCIDENT_STATUSES.includes(status as KocIncidentStatus) ? { status: status as KocIncidentStatus } : { status: 'BLOCKED' as const }),
    page: parseNumber(query.get('page')) ?? 0,
    size: parseNumber(query.get('size')) ?? 20,
  };
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.incidentList.error.loadFailed';
}
