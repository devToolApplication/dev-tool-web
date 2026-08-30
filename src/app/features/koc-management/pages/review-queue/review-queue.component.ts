import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, type ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { normalizePageMetadata, type PageMetadata } from '@core/http/base-response.model';
import type { KocReviewListQuery, KocReviewQueueItem, KocReviewReason, KocReviewStatus } from '../../model/koc-review.model';
import { KocReviewApiService } from '../../services/koc-review-api.service';

const REVIEW_STATUSES: KocReviewStatus[] = ['NOT_REVIEWED', 'APPROVED', 'REJECTED', 'NEED_MORE_EVIDENCE'];

@Component({
  selector: 'app-koc-review-queue',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-queue.component.html',
  styleUrl: './review-queue.component.css',
})
export class ReviewQueueComponent implements OnInit {
  private readonly api = inject(KocReviewApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly query = signal<KocReviewListQuery>({ page: 0, size: 20, status: 'NOT_REVIEWED' });
  readonly reviews = signal<KocReviewQueueItem[]>([]);
  readonly metadata = signal<PageMetadata>(normalizePageMetadata(undefined, 0, 20));
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.query.set(parseReviewQuery(this.route.snapshot.queryParamMap));
    void this.loadReviews();
  }

  async loadReviews(page = this.query().page ?? 0, size = this.query().size ?? 20): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const nextQuery = { ...this.query(), page, size };
    this.query.set(nextQuery);
    try {
      const response = await firstValueFrom(this.api.getReviewQueue(nextQuery));
      this.reviews.set(response.data);
      this.metadata.set(normalizePageMetadata(response.metadata, page, size));
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  openReview(item: KocReviewQueueItem): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/reviews', item.reviewId]);
  }

  reviewReasonLabel(reason: KocReviewReason): string {
    switch (reason) {
      case 'EVIDENCE_CONFLICT':
        return 'koc.review.reason.evidenceConflict';
      case 'BORDERLINE_POLICY':
        return 'koc.review.reason.borderlinePolicy';
      case 'MANUAL_POLICY':
      default:
        return 'koc.review.reason.manualPolicy';
    }
  }

  reviewStatusLabel(status: KocReviewStatus): string {
    return `koc.review.status.${status.toLowerCase()}`;
  }

  totalRecords(): number {
    return this.metadata().totalElements ?? this.reviews().length;
  }
}

function parseReviewQuery(query: Pick<ParamMap, 'get'>): KocReviewListQuery {
  const status = query.get('status');
  return {
    status: REVIEW_STATUSES.includes(status as KocReviewStatus) ? status as KocReviewStatus : 'NOT_REVIEWED',
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
  return error instanceof Error ? error.message : 'koc.reviewQueue.error.loadFailed';
}
