import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { type AppLanguage, I18nService } from '@core/i18n/i18n.service';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import type { KocCandidateSummary } from '../../model/koc-candidate.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { CandidateListComponent } from './candidate-list.component';

describe('CandidateListComponent', () => {
  let fixture: ComponentFixture<CandidateListComponent>;
  let component: CandidateListComponent;
  let api: {
    getCandidatePage: ReturnType<typeof vi.fn>;
    bulkApproveCandidates: ReturnType<typeof vi.fn>;
    bulkRejectCandidates: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  let confirmService: { confirm: ReturnType<typeof vi.fn> };
  let toastService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let i18nService: { language: ReturnType<typeof signal<AppLanguage>>; t: ReturnType<typeof vi.fn> };

  const candidate1: KocCandidateSummary = {
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    displayName: 'Parent creator 1',
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 1200,
    screeningProgress: 60,
    reason: 'Facebook auth expired',
    updatedAt: '2026-08-23T08:00:00Z',
  };

  const candidate2: KocCandidateSummary = {
    candidateId: 'candidate-2',
    campaignId: 'campaign-1',
    displayName: 'Parent creator 2',
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 3500,
    screeningProgress: 80,
    reason: 'Under review',
    updatedAt: '2026-08-23T09:00:00Z',
  };

  const candidateDifferentCamp: KocCandidateSummary = {
    candidateId: 'candidate-3',
    campaignId: 'campaign-2',
    displayName: 'Creator Camp 2',
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 5000,
    screeningProgress: 90,
    reason: 'Reviewing',
    updatedAt: '2026-08-23T10:00:00Z',
  };

  beforeEach(() => {
    api = {
      getCandidatePage: vi.fn(() =>
        of(createBasePageResponse([candidate1, candidate2], 2, 25, 1)),
      ),
      bulkApproveCandidates: vi.fn(() =>
        of({
          results: [
            { candidateId: 'candidate-1', success: true },
            { candidateId: 'candidate-2', success: true },
          ],
          successCount: 2,
          failureCount: 0,
        }),
      ),
      bulkRejectCandidates: vi.fn(() =>
        of({
          results: [
            { candidateId: 'candidate-1', success: true },
            { candidateId: 'candidate-2', success: true },
          ],
          successCount: 2,
          failureCount: 0,
        }),
      ),
    };
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
    confirmService = {
      confirm: vi.fn(() => Promise.resolve(true)),
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
    };
    i18nService = {
      language: signal<AppLanguage>('vi'),
      t: vi.fn((key: string) => {
        if (key === 'koc.candidates.bulk.approveConfirmMessage') {
          return 'Ban co chac chan muon approve {{count}} candidates da chon khong?';
        }
        return key;
      }),
    };

    TestBed.configureTestingModule({
      declarations: [CandidateListComponent, TranslateContentPipe],
      providers: [
        { provide: KocCandidateApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: ConfirmDialogService, useValue: confirmService },
        { provide: ToastService, useValue: toastService },
        { provide: I18nService, useValue: i18nService },
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
    expect(component.candidates()).toEqual([candidate1, candidate2]);
  });

  it('keeps filters in the URL and opens candidate detail', () => {
    component.query.set({ campaignId: 'campaign-1', decision: 'WAITING', page: 1, size: 25 });

    component.applyQuickDecision('REJECTED');
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { campaignId: 'campaign-1', decision: 'REJECTED', page: 0, size: 25 },
    });

    component.openCandidate(candidate1);
    expect(router.navigate).toHaveBeenLastCalledWith([
      '/ai-agent-mcrs/koc/candidates',
      'candidate-1',
    ]);
  });

  it('applies quick decision chips through URL filters', () => {
    component.query.set({ campaignId: 'campaign-1', page: 1, size: 25 });

    component.applyQuickDecision('ACCEPTED');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { campaignId: 'campaign-1', decision: 'ACCEPTED', page: 0, size: 25 },
    });
  });

  describe('selection & cross-campaign state', () => {
    it('disables bulk actions when no rows are selected', () => {
      component.selectedCandidates.set([]);
      const config = component.tableConfig();
      const bulkApprove = config.toolbar?.bulkActions?.find((a) => a.id === 'bulk-approve');
      expect(bulkApprove?.disabled).toBe(true);
      expect(component.isCrossCampaignSelection()).toBe(false);
    });

    it('enables bulk actions when rows from same campaign are selected', () => {
      component.selectedCandidates.set([candidate1, candidate2]);
      const config = component.tableConfig();
      const bulkApprove = config.toolbar?.bulkActions?.find((a) => a.id === 'bulk-approve');
      expect(bulkApprove?.disabled).toBe(false);
      expect(component.isCrossCampaignSelection()).toBe(false);
    });

    it('disables bulk actions and sets cross-campaign flag when candidates from multiple campaigns are selected', () => {
      component.selectedCandidates.set([candidate1, candidateDifferentCamp]);
      const config = component.tableConfig();
      const bulkApprove = config.toolbar?.bulkActions?.find((a) => a.id === 'bulk-approve');
      expect(bulkApprove?.disabled).toBe(true);
      expect(component.isCrossCampaignSelection()).toBe(true);
    });
  });

  describe('bulk approve', () => {
    it('shows confirmation dialog and executes bulk approve API on confirm', async () => {
      component.selectedCandidates.set([candidate1, candidate2]);

      await component.handleBulkApprove();

      expect(confirmService.confirm).toHaveBeenCalledWith({
        title: 'koc.candidates.bulk.approveConfirmTitle',
        message: 'Ban co chac chan muon approve 2 candidates da chon khong?',
        confirmText: 'koc.candidates.action.submit',
        cancelText: 'koc.candidates.action.cancel',
        variant: 'info',
      });
      expect(api.bulkApproveCandidates).toHaveBeenCalledTimes(1);
      expect(api.bulkApproveCandidates).toHaveBeenCalledWith({
        candidateIds: ['candidate-1', 'candidate-2'],
      });
      expect(toastService.success).toHaveBeenCalledWith('koc.candidates.bulk.successApprove');
      expect(component.selectedCandidates()).toEqual([]);
    });

    it('cancels bulk approve when user dismisses confirm dialog', async () => {
      confirmService.confirm.mockResolvedValueOnce(false);
      component.selectedCandidates.set([candidate1]);

      await component.handleBulkApprove();

      expect(api.bulkApproveCandidates).not.toHaveBeenCalled();
      expect(component.selectedCandidates()).toEqual([candidate1]);
    });

    it('surfaces backend error message on failure', async () => {
      api.bulkApproveCandidates.mockReturnValueOnce(
        throwError(() => ({ error: { errorMessage: 'KOC_REVIEW_DECISION_INVALID' } })),
      );
      component.selectedCandidates.set([candidate1]);

      await component.handleBulkApprove();

      expect(toastService.error).toHaveBeenCalledWith('KOC_REVIEW_DECISION_INVALID');
      expect(component.error()).toBe('KOC_REVIEW_DECISION_INVALID');
    });
  });

  describe('bulk reject', () => {
    it('opens reject modal with candidate entries', () => {
      component.selectedCandidates.set([candidate1, candidate2]);

      component.handleBulkReject();

      expect(component.rejectDialogVisible()).toBe(true);
      expect(component.rejectReasons()).toEqual({
        'candidate-1': '',
        'candidate-2': '',
      });
    });

    it('validates 500 max characters per reject reason', () => {
      component.selectedCandidates.set([candidate1]);
      component.handleBulkReject();

      component.updateRejectReason('candidate-1', 'a'.repeat(501));
      expect(component.isReasonInvalid('candidate-1')).toBe(true);
      expect(component.hasInvalidRejectReasons()).toBe(true);

      component.updateRejectReason('candidate-1', 'a'.repeat(500));
      expect(component.isReasonInvalid('candidate-1')).toBe(false);
      expect(component.hasInvalidRejectReasons()).toBe(false);
    });

    it('submits bulk reject with prepared reasons and trims whitespace', async () => {
      component.selectedCandidates.set([candidate1, candidate2]);
      component.handleBulkReject();
      component.updateRejectReason('candidate-1', '   Not suitable for brand   ');
      component.updateRejectReason('candidate-2', '   ');

      await component.submitBulkReject();

      expect(api.bulkRejectCandidates).toHaveBeenCalledTimes(1);
      expect(api.bulkRejectCandidates).toHaveBeenCalledWith({
        candidateIds: ['candidate-1', 'candidate-2'],
        reasons: [
          { candidateId: 'candidate-1', reason: 'Not suitable for brand' },
        ],
      });
      expect(toastService.success).toHaveBeenCalledWith('koc.candidates.bulk.successReject');
      expect(component.rejectDialogVisible()).toBe(false);
      expect(component.selectedCandidates()).toEqual([]);
    });
  });
});
