import { convertToParamMap } from '@angular/router';

import type { KocCandidateSummary } from './koc-candidate.model';
import {
  buildKocCandidateRowActions,
  buildKocCandidateTableConfig,
  candidateDecisionI18nKey,
  candidateExecutionStatusI18nKey,
  isSameCampaignSelection,
  parseKocCandidateListQuery,
  prepareBulkRejectReason,
  serializeKocCandidateListQuery,
  validateRejectReasonLength,
} from './koc-candidate-list.config';

function createCandidate(
  candidateId: string,
  campaignId: string,
  overrides: Partial<KocCandidateSummary> = {},
): KocCandidateSummary {
  return {
    candidateId,
    campaignId,
    displayName: `Creator ${candidateId}`,
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 5000,
    screeningProgress: 50,
    reason: 'Under review',
    updatedAt: '2026-08-30T10:00:00Z',
    ...overrides,
  };
}

describe('KOC candidate list config & helpers', () => {
  it('builds table config with multi-selection and bulk actions', () => {
    const config = buildKocCandidateTableConfig();

    expect(config.selection?.mode).toBe('multiple');
    expect(config.rowKey).toBe('candidateId');
    expect(config.toolbar?.bulkActions?.map((action) => action.id)).toEqual([
      'bulk-approve',
      'bulk-reject',
    ]);
    expect(config.columns.map((c) => c.field)).toContain('candidate');
    expect(config.columns.map((c) => c.field)).toContain('campaign');
    expect(config.columns.map((c) => c.field)).toContain('decision');
    expect(config.columns.map((c) => c.field)).toContain('executionStatus');
    expect(config.columns.map((c) => c.field)).toContain('actions');

    const progressCol = config.columns.find((c) => c.field === 'screeningProgress');
    expect(progressCol?.header).toBe('koc.candidates.column.progress');

    const executionCol = config.columns.find((c) => c.field === 'executionStatus');
    expect(executionCol?.header).toBe('koc.candidates.column.executionStatus');
  });

  it('maps decision and execution status to canonical i18n keys', () => {
    expect(candidateDecisionI18nKey('WAITING')).toBe('koc.candidate.status.waiting');
    expect(candidateDecisionI18nKey('ACCEPTED')).toBe('koc.candidate.status.accepted');
    expect(candidateDecisionI18nKey('REJECTED')).toBe('koc.candidate.status.rejected');

    expect(candidateExecutionStatusI18nKey('READY_FOR_SCREENING')).toBe(
      'koc.execution.status.readyForScreening',
    );
    expect(candidateExecutionStatusI18nKey('WAITING_DEPENDENCY')).toBe(
      'koc.execution.status.waitingDependency',
    );
    expect(candidateExecutionStatusI18nKey('DISCOVERED')).toBe(
      'koc.execution.status.discovered',
    );
  });

  it('row actions include open candidate detail', () => {
    const onOpen = vi.fn();
    const actions = buildKocCandidateRowActions(onOpen);
    const openAction = actions.find((a) => a.id === 'open');

    expect(openAction).toBeDefined();
    const row = createCandidate('cand-1', 'camp-1');
    openAction?.onClick(row);
    expect(onOpen).toHaveBeenCalledWith(row);
  });

  describe('isSameCampaignSelection', () => {
    it('returns false for empty selection', () => {
      expect(isSameCampaignSelection([])).toBe(false);
    });

    it('returns true when all selected candidates belong to the same campaign', () => {
      const rows = [
        createCandidate('cand-1', 'camp-1'),
        createCandidate('cand-2', 'camp-1'),
        createCandidate('cand-3', 'camp-1'),
      ];
      expect(isSameCampaignSelection(rows)).toBe(true);
    });

    it('returns false when selected candidates belong to different campaigns', () => {
      const rows = [
        createCandidate('cand-1', 'camp-1'),
        createCandidate('cand-2', 'camp-2'),
      ];
      expect(isSameCampaignSelection(rows)).toBe(false);
    });
  });

  describe('reject reason validation and preparation', () => {
    it('allows blank reason and reasons <= 500 characters', () => {
      expect(validateRejectReasonLength('')).toBe(true);
      expect(validateRejectReasonLength('   ')).toBe(true);
      expect(validateRejectReasonLength('a'.repeat(500))).toBe(true);
      expect(validateRejectReasonLength('a'.repeat(501))).toBe(false);
    });

    it('prepares trimmed reject reason or undefined for blank', () => {
      expect(prepareBulkRejectReason('')).toBeUndefined();
      expect(prepareBulkRejectReason('   ')).toBeUndefined();
      expect(prepareBulkRejectReason('  Does not meet brand policy  ')).toBe(
        'Does not meet brand policy',
      );
    });
  });

  describe('query parsing and serialization', () => {
    it('parses URL query params including campaignId', () => {
      const paramMap = convertToParamMap({
        campaignId: 'camp-100',
        search: 'john',
        decision: 'ACCEPTED',
        executionStatus: 'RUNNING',
        page: '2',
        size: '50',
      });
      const query = parseKocCandidateListQuery(paramMap);

      expect(query).toEqual({
        campaignId: 'camp-100',
        search: 'john',
        decision: 'ACCEPTED',
        executionStatus: 'RUNNING',
        page: 2,
        size: 50,
      });
    });

    it('serializes query preserving valid params and omitting blank ones', () => {
      const serialized = serializeKocCandidateListQuery({
        campaignId: 'camp-100',
        search: '  ',
        decision: 'REJECTED',
        page: 0,
        size: 20,
      });

      expect(serialized).toEqual({
        campaignId: 'camp-100',
        decision: 'REJECTED',
        page: 0,
        size: 20,
      });
    });
  });
});
