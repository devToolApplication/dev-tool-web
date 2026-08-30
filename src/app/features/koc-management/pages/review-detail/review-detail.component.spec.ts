import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { PermissionService } from '@core/auth/permission.service';
import type { KocCandidateDetail } from '../../model/koc-candidate.model';
import type { KocEvidenceItem } from '../../model/koc-evidence.model';
import type { KocReviewQueueItem } from '../../model/koc-review.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { KocReviewApiService } from '../../services/koc-review-api.service';
import { ReviewDetailComponent } from './review-detail.component';

describe('ReviewDetailComponent', () => {
  let fixture: ComponentFixture<ReviewDetailComponent>;
  let component: ReviewDetailComponent;
  let reviewApi: {
    getReview: ReturnType<typeof vi.fn>;
    submitDecision: ReturnType<typeof vi.fn>;
  };
  let candidateApi: {
    getCandidate: ReturnType<typeof vi.fn>;
    getEvidence: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let permissionService: { hasAny: ReturnType<typeof vi.fn> };

  const review: KocReviewQueueItem = {
    reviewId: 'review-1',
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    reason: 'BORDERLINE_POLICY',
    status: 'NOT_REVIEWED',
  };
  const candidate: KocCandidateDetail = {
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    displayName: 'Parent creator',
    decision: 'REVIEW',
    executionStatus: 'COMPLETED',
    evidenceCount: 1,
  };
  const evidence: KocEvidenceItem[] = [
    {
      evidenceId: 'evidence-1',
      state: 'INSUFFICIENT',
      sourceType: 'FACEBOOK_POST',
      excerpt: 'Borderline comment quality',
      coverage: 'Needs human policy review',
    },
  ];

  beforeEach(() => {
    reviewApi = {
      getReview: vi.fn(() => of(review)),
      submitDecision: vi.fn(() => of({ ...review, status: 'APPROVED' })),
    };
    candidateApi = {
      getCandidate: vi.fn(() => of(candidate)),
      getEvidence: vi.fn(() => of(evidence)),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    permissionService = { hasAny: vi.fn(() => true) };

    TestBed.configureTestingModule({
      declarations: [ReviewDetailComponent],
      providers: [
        { provide: KocReviewApiService, useValue: reviewApi },
        { provide: KocCandidateApiService, useValue: candidateApi },
        { provide: PermissionService, useValue: permissionService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reviewId: 'review-1' }) } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ReviewDetailComponent);
    component = fixture.componentInstance;
  });

  it('loads review with candidate evidence context', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(reviewApi.getReview).toHaveBeenCalledWith('review-1');
    expect(candidateApi.getCandidate).toHaveBeenCalledWith('candidate-1');
    expect(candidateApi.getEvidence).toHaveBeenCalledWith('candidate-1');
    expect(component.review()).toEqual(review);
    expect(component.candidate()).toEqual(candidate);
    expect(component.evidence()).toEqual(evidence);
  });

  it('requires reviewer reason before manual decision submit', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.submitDecision('REJECTED');
    expect(reviewApi.submitDecision).not.toHaveBeenCalled();
    expect(component.decisionError()).toBe('koc.reviewDetail.validation.reasonRequired');

    component.decisionReason.set('Not enough business evidence');
    await component.submitDecision('REJECTED');

    expect(reviewApi.submitDecision).toHaveBeenCalledWith('review-1', {
      decision: 'REJECTED',
      reason: 'Not enough business evidence',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/reviews']);
  });

  it('disables and no-ops submitDecision when review permissions are absent', async () => {
    permissionService.hasAny.mockReturnValue(false);
    expect(component.canReview()).toBe(false);

    component.decisionReason.set('Reason provided');
    await component.submitDecision('APPROVED');

    expect(reviewApi.submitDecision).not.toHaveBeenCalled();
  });
});