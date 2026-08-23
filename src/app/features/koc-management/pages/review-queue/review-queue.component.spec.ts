import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import type { KocReviewQueueItem } from '../../model/koc-review.model';
import { KocReviewApiService } from '../../services/koc-review-api.service';
import { ReviewQueueComponent } from './review-queue.component';

describe('ReviewQueueComponent', () => {
  let fixture: ComponentFixture<ReviewQueueComponent>;
  let component: ReviewQueueComponent;
  let api: { getReviewQueue: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const item: KocReviewQueueItem = {
    reviewId: 'review-1',
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    reason: 'EVIDENCE_CONFLICT',
    status: 'PENDING',
    updatedAt: '2026-08-23T08:00:00Z',
  };

  beforeEach(() => {
    api = { getReviewQueue: vi.fn(() => of(createBasePageResponse([item], 0, 20, 1))) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [ReviewQueueComponent],
      providers: [
        { provide: KocReviewApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ status: 'PENDING' }) } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ReviewQueueComponent);
    component = fixture.componentInstance;
  });

  it('loads only business review queue items from REST filters', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getReviewQueue).toHaveBeenCalledWith({ status: 'PENDING', page: 0, size: 20 });
    expect(component.reviews()).toEqual([item]);
    expect(component.reviewReasonLabel(item.reason)).toBe('koc.review.reason.evidenceConflict');
  });

  it('opens review detail from queue item', () => {
    component.openReview(item);

    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/koc/reviews', 'review-1']);
  });
});
