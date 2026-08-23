import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin, of, switchMap } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import type { KocBusinessDecision } from '../../model/koc-common.model';
import type { KocCandidateDetail } from '../../model/koc-candidate.model';
import type { KocEvidenceItem } from '../../model/koc-evidence.model';
import type { KocReviewQueueItem, KocReviewReason } from '../../model/koc-review.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { KocReviewApiService } from '../../services/koc-review-api.service';

type ReviewDecision = Extract<KocBusinessDecision, 'ACCEPTED' | 'REJECTED' | 'SCREENING'>;

@Component({
  selector: 'app-koc-review-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-detail.component.html',
  styleUrl: './review-detail.component.css',
})
export class ReviewDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reviewApi = inject(KocReviewApiService);
  private readonly candidateApi = inject(KocCandidateApiService);
  private readonly permissionService = inject(PermissionService);

  readonly reviewId = signal(this.route.snapshot.paramMap.get('reviewId') ?? '');
  readonly review = signal<KocReviewQueueItem | null>(null);
  readonly candidate = signal<KocCandidateDetail | null>(null);
  readonly evidence = signal<KocEvidenceItem[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly decisionReason = signal('');
  readonly decisionError = signal<string | null>(null);

  readonly canReview = computed(() => this.permissionService.hasAny(['AI_AGENT_WORKFLOW_REVIEW', 'AI_AGENT_WORKFLOW_WRITE']));

  ngOnInit(): void {
    void this.loadReview();
  }

  async loadReview(): Promise<void> {
    const reviewId = this.reviewId();
    if (!reviewId) {
      this.error.set('koc.reviewDetail.error.missingReview');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.reviewApi.getReview(reviewId).pipe(
          switchMap((review) => forkJoin({
            review: of(review),
            candidate: this.candidateApi.getCandidate(review.candidateId),
            evidence: this.candidateApi.getEvidence(review.candidateId),
          })),
        ),
      );
      this.review.set(response.review);
      this.candidate.set(response.candidate);
      this.evidence.set(response.evidence);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async submitDecision(decision: ReviewDecision): Promise<void> {
    if (!this.canReview()) {
      return;
    }

    const reason = this.decisionReason().trim();
    if (!reason) {
      this.decisionError.set('koc.reviewDetail.validation.reasonRequired');
      return;
    }

    this.saving.set(true);
    this.decisionError.set(null);
    try {
      await firstValueFrom(this.reviewApi.submitDecision(this.reviewId(), { decision, reason }));
      await this.router.navigate(['/ai-agent-mcrs/koc/reviews']);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  reviewReasonLabel(reason: KocReviewReason | undefined): string {
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
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.reviewDetail.error.loadFailed';
}