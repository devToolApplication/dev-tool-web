import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, type PageMetadata } from '@core/http/base-response.model';
import { I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import type {
  TableAction,
  TableBulkAction,
  TableConfig,
  TableFilterValue,
} from '@shared/ui/patterns/table/models/table-config.model';
import {
  buildKocCandidateRowActions,
  buildKocCandidateTableConfig,
  isSameCampaignSelection,
  parseKocCandidateListQuery,
  prepareBulkRejectReason,
  serializeKocCandidateListQuery,
  validateRejectReasonLength,
} from '../../model/koc-candidate-list.config';
import type {
  KocCandidateListQuery,
  KocCandidateSummary,
} from '../../model/koc-candidate.model';
import type { KocBusinessDecision } from '../../model/koc-common.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';

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
  private readonly confirmService = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);
  private readonly i18nService = inject(I18nService);

  readonly query = signal<KocCandidateListQuery>({ page: 0, size: 20 });
  readonly candidates = signal<KocCandidateSummary[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedCandidates = signal<KocCandidateSummary[]>([]);
  readonly rejectDialogVisible = signal(false);
  readonly rejectReasons = signal<Record<string, string>>({});
  readonly rejectSubmitting = signal(false);

  readonly isSameCampaign = computed(() =>
    isSameCampaignSelection(this.selectedCandidates()),
  );

  readonly isCrossCampaignSelection = computed(
    () =>
      this.selectedCandidates().length > 1 && !this.isSameCampaign(),
  );

  readonly tableConfig = computed<TableConfig<KocCandidateSummary>>(() => {
    const hasSelection = this.selectedCandidates().length > 0;
    const sameCampaign = this.isSameCampaign();
    const bulkDisabled = !hasSelection || !sameCampaign || this.loading();

    const rowActions = buildKocCandidateRowActions((row) => this.openCandidate(row));
    const bulkActions: TableBulkAction<KocCandidateSummary>[] = [
      {
        id: 'bulk-approve',
        label: 'koc.candidates.bulk.approve',
        icon: 'pi pi-check',
        variant: 'primary',
        disabled: bulkDisabled,
      },
      {
        id: 'bulk-reject',
        label: 'koc.candidates.bulk.reject',
        icon: 'pi pi-times',
        variant: 'danger',
        disabled: bulkDisabled,
      },
    ];

    return buildKocCandidateTableConfig(rowActions, bulkActions);
  });

  readonly quickDecisionOptions: { label: string; decision?: KocBusinessDecision }[] = [
    { label: 'koc.candidates.quick.all' },
    { label: 'koc.candidates.quick.accepted', decision: 'ACCEPTED' },
    { label: 'koc.candidates.quick.rejected', decision: 'REJECTED' },
    { label: 'koc.candidates.quick.review', decision: 'REVIEW' },
    { label: 'koc.candidates.quick.waiting', decision: 'WAITING' },
  ];

  ngOnInit(): void {
    this.query.set(parseKocCandidateListQuery(this.route.snapshot.queryParamMap));
    void this.loadCandidates();
  }

  async loadCandidates(
    page = this.query().page ?? 0,
    size = this.query().size ?? 20,
  ): Promise<void> {
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

  onSearch(filters: TableFilterValue): void {
    const rawSearch = typeof filters['search'] === 'string' ? filters['search'] : undefined;
    this.navigateWithQuery({
      ...this.query(),
      search: cleanString(rawSearch),
      page: 0,
      size: this.rows(),
    });
  }

  applyQuickDecision(decision?: KocBusinessDecision): void {
    this.navigateWithQuery({
      ...this.query(),
      decision,
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

  onSelectionChange(rows: KocCandidateSummary[]): void {
    this.selectedCandidates.set(rows);
  }

  onTableAction(event: {
    action: TableAction<KocCandidateSummary>;
    row: KocCandidateSummary;
  }): void {
    if (event.action.id === 'open') {
      this.openCandidate(event.row);
    }
  }

  async onBulkAction(event: {
    action: TableBulkAction<KocCandidateSummary>;
    rows: KocCandidateSummary[];
  }): Promise<void> {
    if (!this.isSameCampaign()) {
      return;
    }

    if (event.action.id === 'bulk-approve') {
      await this.handleBulkApprove();
    } else if (event.action.id === 'bulk-reject') {
      this.handleBulkReject();
    }
  }

  async handleBulkApprove(): Promise<void> {
    const selected = this.selectedCandidates();
    if (selected.length === 0 || !this.isSameCampaign()) {
      return;
    }

    const count = selected.length;
    const messageTemplate = this.i18nService.t(
      'koc.candidates.bulk.approveConfirmMessage',
    );
    const message = messageTemplate.replace('{{count}}', String(count));

    const confirmed = await this.confirmService.confirm({
      title: 'koc.candidates.bulk.approveConfirmTitle',
      message,
      confirmText: 'koc.candidates.action.submit',
      cancelText: 'koc.candidates.action.cancel',
      variant: 'info',
    });

    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.api.bulkApproveCandidates({
          candidateIds: selected.map((candidate) => candidate.candidateId),
        }),
      );

      this.toastService.success('koc.candidates.bulk.successApprove');
      this.selectedCandidates.set([]);
      await this.loadCandidates(this.currentPage(), this.rows());
    } catch (err) {
      const msg = errorMessage(err);
      this.toastService.error(msg);
      this.error.set(msg);
      this.loading.set(false);
    }
  }

  handleBulkReject(): void {
    const selected = this.selectedCandidates();
    if (selected.length === 0 || !this.isSameCampaign()) {
      return;
    }

    const initialReasons: Record<string, string> = {};
    for (const c of selected) {
      initialReasons[c.candidateId] = '';
    }
    this.rejectReasons.set(initialReasons);
    this.rejectDialogVisible.set(true);
  }

  updateRejectReason(candidateId: string, value: string | null): void {
    this.rejectReasons.update((reasons) => ({
      ...reasons,
      [candidateId]: value ?? '',
    }));
  }

  isReasonInvalid(candidateId: string): boolean {
    const reason = this.rejectReasons()[candidateId] ?? '';
    return !validateRejectReasonLength(reason);
  }

  hasInvalidRejectReasons(): boolean {
    const reasons = this.rejectReasons();
    return Object.values(reasons).some((reason) => !validateRejectReasonLength(reason));
  }

  closeRejectDialog(): void {
    this.rejectDialogVisible.set(false);
  }

  async submitBulkReject(): Promise<void> {
    if (this.hasInvalidRejectReasons() || this.rejectSubmitting()) {
      return;
    }

    const selected = this.selectedCandidates();
    const reasons = this.rejectReasons();

    this.rejectSubmitting.set(true);
    try {
      const reasonRequests = selected
        .map((candidate) => {
          const rawReason = reasons[candidate.candidateId];
          const preparedReason = prepareBulkRejectReason(rawReason);
          return preparedReason
            ? { candidateId: candidate.candidateId, reason: preparedReason }
            : null;
        })
        .filter((item): item is { candidateId: string; reason: string } => item !== null);

      await firstValueFrom(
        this.api.bulkRejectCandidates({
          candidateIds: selected.map((candidate) => candidate.candidateId),
          ...(reasonRequests.length > 0 ? { reasons: reasonRequests } : {}),
        }),
      );

      this.toastService.success('koc.candidates.bulk.successReject');
      this.rejectDialogVisible.set(false);
      this.selectedCandidates.set([]);
      await this.loadCandidates(this.currentPage(), this.rows());
    } catch (err) {
      const msg = errorMessage(err);
      this.toastService.error(msg);
    } finally {
      this.rejectSubmitting.set(false);
    }
  }

  openCandidate(candidate: KocCandidateSummary): void {
    void this.router.navigate([
      '/ai-agent-mcrs/koc/candidates',
      candidate.candidateId,
    ]);
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.candidates().length;
  }

  currentPage(): number {
    return (
      this.metadata().currentPage ??
      this.metadata().pageNumber ??
      this.query().page ??
      0
    );
  }

  rows(): number {
    return (
      this.metadata().size ??
      this.metadata().pageSize ??
      this.query().size ??
      20
    );
  }

  private navigateWithQuery(query: KocCandidateListQuery): void {
    const normalized = {
      ...query,
      size: query.size ?? this.query().size ?? 20,
    };
    this.query.set(normalized);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeKocCandidateListQuery(normalized),
    });
  }
}

function cleanString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = (error as { error?: { message?: string; errorMessage?: string } }).error;
    if (apiError?.errorMessage) {
      return apiError.errorMessage;
    }
    if (apiError?.message) {
      return apiError.message;
    }
  }
  return error instanceof Error ? error.message : 'koc.candidates.error.loadFailed';
}
