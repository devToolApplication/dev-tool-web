import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import type { KocCandidateSummary } from '../../model/koc-candidate.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { CandidateListComponent } from './candidate-list.component';

describe('CandidateListComponent', () => {
  let fixture: ComponentFixture<CandidateListComponent>;
  let component: CandidateListComponent;
  let api: { getCandidatePage: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };

  const candidate: KocCandidateSummary = {
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    displayName: 'Parent creator',
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 1200,
    screeningProgress: 60,
    reason: 'Facebook auth expired',
    updatedAt: '2026-08-23T08:00:00Z',
  };

  beforeEach(() => {
    api = { getCandidatePage: vi.fn(() => of(createBasePageResponse([candidate], 1, 25, 1))) };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    route = {
      snapshot: {
        queryParamMap: convertToParamMap({
          campaignId: 'campaign-1',
          decision: 'WAITING',
          executionStatus: 'WAITING_DEPENDENCY',
          page: '1',
          size: '25',
        }),
      },
    };

    TestBed.configureTestingModule({
      declarations: [CandidateListComponent, TranslateContentPipe],
      providers: [
        { provide: KocCandidateApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CandidateListComponent);
    component = fixture.componentInstance;
  });

  it('loads URL-addressable candidate filters from REST', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getCandidatePage).toHaveBeenCalledWith({
      campaignId: 'campaign-1',
      decision: 'WAITING',
      executionStatus: 'WAITING_DEPENDENCY',
      page: 1,
      size: 25,
    });
    expect(component.candidates()).toEqual([candidate]);
  });

  it('keeps filters in the URL and opens candidate detail', () => {
    component.query.set({ campaignId: 'campaign-1', decision: 'WAITING', page: 1, size: 25 });

    component.onDecisionFilter('REJECTED');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { campaignId: 'campaign-1', decision: 'REJECTED', page: 0, size: 25 },
    });

    component.openCandidate(candidate);
    expect(router.navigate).toHaveBeenLastCalledWith(['/ai-agent-mcrs/koc/candidates', 'candidate-1']);
  });

  it('applies quick decision chips through URL filters', () => {
    component.query.set({ campaignId: 'campaign-1', page: 1, size: 25 });

    component.applyQuickDecision('ACCEPTED');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { campaignId: 'campaign-1', decision: 'ACCEPTED', page: 0, size: 25 },
    });
  });
});
