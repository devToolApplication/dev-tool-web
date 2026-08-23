import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, type PageMetadata } from '@core/http/base-response.model';
import type { SelectOption, SelectValue } from '@shared/ui/primitives/select/select';
import type { KocCandidateListQuery, KocCandidateSummary } from '../../model/koc-candidate.model';
import type { KocBusinessDecision, KocExecutionStatus } from '../../model/koc-common.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';

const DECISIONS: KocBusinessDecision[] = ['ACCEPTED', 'REJECTED', 'REVIEW', 'SCREENING', 'WAITING'];
const EXECUTION_STATUSES: KocExecutionStatus[] = [
  'PENDING',
  'RUNNING',
  'WAITING',
  'WAITING_DEPENDENCY',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
];

@Component({
  selector: 'app-koc-candidate-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './candidate-list.component.html',
  styleUrl: './candidate-list.component.css',
})
export class CandidateListComponent implements OnInit {
  private readonly api = inject(KocCandidateApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly query = signal<KocCandidateListQuery>({ page: 0, size: 20 });
  readonly candidates = signal<KocCandidateSummary[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly decisionOptions: SelectOption[] = [
    { label: 'koc.candidates.filter.allDecisions', value: null },
    ...DECISIONS.map((decision) => ({ label: `koc.candidate.status.${decision.toLowerCase()}`, value: decision })),
  ];
  readonly executionStatusOptions: SelectOption[] = [
    { label: 'koc.candidates.filter.allExecutionStatuses', value: null },
    ...EXECUTION_STATUSES.map((status) => ({ label: executionStatusLabel(status), value: status })),
  ];
  readonly quickDecisionOptions: { label: string; decision?: KocBusinessDecision }[] = [
    { label: 'koc.candidates.quick.all' },
    { label: 'koc.candidates.quick.accepted', decision: 'ACCEPTED' },
    { label: 'koc.candidates.quick.rejected', decision: 'REJECTED' },
    { label: 'koc.candidates.quick.review', decision: 'REVIEW' },
    { label: 'koc.candidates.quick.waiting', decision: 'WAITING' },
  ];

  ngOnInit(): void {
    this.query.set(parseCandidateQuery(this.route.snapshot.queryParamMap));
    void this.loadCandidates();
  }

  async loadCandidates(page = this.query().page ?? 0, size = this.query().size ?? 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const nextQuery = { ...this.query(), page, size };
    this.query.set(nextQuery);
    try {
      const response = await firstValueFrom(this.api.getCandidatePage(nextQuery));
      this.candidates.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(value: string | null): void {
    this.navigateWithQuery({ ...this.query(), search: cleanString(value), page: 0 });
  }

  onDecisionFilter(value: SelectValue): void {
    this.navigateWithQuery({ ...this.query(), decision: normalizeDecision(value), page: 0 });
  }

  applyQuickDecision(decision?: KocBusinessDecision): void {
    this.navigateWithQuery({ ...this.query(), decision, page: 0 });
  }

  onExecutionStatusFilter(value: SelectValue): void {
    this.navigateWithQuery({ ...this.query(), executionStatus: normalizeExecutionStatus(value), page: 0 });
  }

  openCandidate(candidate: KocCandidateSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/candidates', candidate.candidateId]);
  }

  decisionLabel(candidate: KocCandidateSummary): string {
    return `koc.candidate.status.${candidate.decision.toLowerCase()}`;
  }

  executionLabel(status: KocExecutionStatus): string {
    return executionStatusLabel(status);
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.candidates().length;
  }

  private navigateWithQuery(query: KocCandidateListQuery): void {
    const normalized = { ...query, size: query.size ?? this.query().size ?? 20 };
    this.query.set(normalized);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeCandidateQuery(normalized),
    });
  }
}

function parseCandidateQuery(query: Pick<ParamMap, 'get'>): KocCandidateListQuery {
  return {
    ...(cleanString(query.get('campaignId')) ? { campaignId: cleanString(query.get('campaignId')) } : {}),
    ...(cleanString(query.get('search')) ? { search: cleanString(query.get('search')) } : {}),
    ...(normalizeDecision(query.get('decision')) ? { decision: normalizeDecision(query.get('decision')) } : {}),
    ...(normalizeExecutionStatus(query.get('executionStatus')) ? { executionStatus: normalizeExecutionStatus(query.get('executionStatus')) } : {}),
    ...(cleanString(query.get('rejectReason')) ? { rejectReason: cleanString(query.get('rejectReason')) } : {}),
    page: parseNumber(query.get('page')) ?? 0,
    size: parseNumber(query.get('size')) ?? 20,
  };
}

function serializeCandidateQuery(query: KocCandidateListQuery): Record<string, string | number> {
  return {
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(query.search ? { search: query.search } : {}),
    ...(query.decision ? { decision: query.decision } : {}),
    ...(query.executionStatus ? { executionStatus: query.executionStatus } : {}),
    ...(query.rejectReason ? { rejectReason: query.rejectReason } : {}),
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.size !== undefined ? { size: query.size } : {}),
  };
}

function normalizeDecision(value: SelectValue): KocBusinessDecision | undefined {
  return typeof value === 'string' && DECISIONS.includes(value as KocBusinessDecision)
    ? value as KocBusinessDecision
    : undefined;
}

function normalizeExecutionStatus(value: SelectValue): KocExecutionStatus | undefined {
  return typeof value === 'string' && EXECUTION_STATUSES.includes(value as KocExecutionStatus)
    ? value as KocExecutionStatus
    : undefined;
}

function executionStatusLabel(status: KocExecutionStatus): string {
  return status === 'WAITING_DEPENDENCY'
    ? 'koc.execution.status.waitingDependency'
    : `koc.execution.status.${status.toLowerCase()}`;
}

function cleanString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.candidates.error.loadFailed';
}
