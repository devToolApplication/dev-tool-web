import {
  GenericApprovalContent,
  KocCandidateApprovalContent,
  KocDiscoveryDecisionContent,
  Manual2faConfirmationContent,
  SUPPORTED_FORM_KEYS,
  UserTaskDetail,
  UserTaskSummary,
} from '../models/user-task.model';
import { UserTaskMapper } from './user-task.mapper';

describe('UserTaskMapper', () => {
  const baseTaskSummary: UserTaskSummary = {
    taskId: 'task-100',
    processInstanceId: 'proc-100',
    businessKey: 'biz-100',
    formKey: SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
    taskName: 'Approve KOC',
    processDefinitionName: 'KOC Discovery',
    assignee: 'lamld',
    createdAt: '2026-09-09T00:00:00Z',
    dueAt: '2026-09-10T00:00:00Z',
    priority: 50,
    completed: false,
    claimable: true,
    readOnly: false,
    canAct: true,
    allowedActions: ['APPROVE', 'REJECT'],
  };

  it('maps KOC_CANDIDATE_APPROVAL raw content into discriminated union', () => {
    const raw = {
      campaignId: 'camp-1',
      campaignName: 'Test Campaign',
      niche: 'Beauty',
      targetCount: 5,
      minScore: 80,
      candidates: [
        {
          externalProfileId: 'p-1',
          fullName: 'Nguyen Van A',
          profileUrl: 'https://example.com/a',
          platform: 'TIKTOK',
          followerCount: 10000,
          engagementRate: 5.5,
          score: 85,
          strengths: ['High engagement'],
          risks: [],
          internalToken: 'must-not-pass-through',
        },
      ],
      rawProcessSecret: 'must-not-pass-through',
    };

    const mapped = UserTaskMapper.mapContent(
      SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
      raw,
    );

    expect(mapped.formKey).toBe(SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL);
    expect(mapped.content).not.toBeNull();
    const content: KocCandidateApprovalContent = mapped.content!;
    expect(content.campaignId).toBe('camp-1');
    expect(content.campaignName).toBe('Test Campaign');
    expect(content.targetCount).toBe(5);
    expect(content.candidates.length).toBe(1);
    expect(content).not.toHaveProperty('rawProcessSecret');
    expect(content.candidates[0]).not.toHaveProperty('internalToken');
  });

  it('maps KOC_DISCOVERY_DECISION raw content into discriminated union', () => {
    const raw = {
      campaignId: 'camp-2',
      campaignName: 'Discovery Campaign',
      niche: 'Fashion',
      currentRound: 2,
      roundLimit: 5,
      qualifiedCount: 12,
      targetCount: 20,
      candidatePreview: [
        {
          externalProfileId: 'p-2',
          fullName: 'Tran B',
          profileUrl: 'https://example.com/b',
          platform: 'FACEBOOK',
          followerCount: 50000,
          score: 90,
        },
      ],
    };

    const mapped = UserTaskMapper.mapContent(
      SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
      raw,
    );

    expect(mapped.formKey).toBe(SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION);
    expect(mapped.content).not.toBeNull();
    const content: KocDiscoveryDecisionContent = mapped.content!;
    expect(content.currentRound).toBe(2);
    expect(content.roundLimit).toBe(5);
    expect(content.qualifiedCount).toBe(12);
    expect(content.candidatePreview.length).toBe(1);
  });

  it('maps MANUAL_2FA_CONFIRMATION raw content into discriminated union', () => {
    const raw = {
      platform: 'Google',
      actionRequired: 'TAP_NUMBER',
      verificationNumber: '42',
      message: 'Tap 42 on your phone',
    };

    const mapped = UserTaskMapper.mapContent(
      SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
      raw,
    );

    expect(mapped.formKey).toBe(SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION);
    expect(mapped.content).not.toBeNull();
    const content: Manual2faConfirmationContent = mapped.content!;
    expect(content.platform).toBe('Google');
    expect(content.verificationNumber).toBe('42');
    expect(content.message).toBe('Tap 42 on your phone');
  });

  it('maps APPROVAL raw content into discriminated union', () => {
    const raw = {
      title: 'Budget Request',
      summary: 'Q3 marketing budget',
      reference: 'REF-001',
      requester: 'lamld',
      submittedAt: '2026-09-09T00:00:00Z',
      fields: [{ key: 'amount', label: 'Amount', value: '$5,000' }],
    };

    const mapped = UserTaskMapper.mapContent(SUPPORTED_FORM_KEYS.APPROVAL, raw);

    expect(mapped.formKey).toBe(SUPPORTED_FORM_KEYS.APPROVAL);
    expect(mapped.content).not.toBeNull();
    const content: GenericApprovalContent = mapped.content!;
    expect(content.title).toBe('Budget Request');
    expect(content.fields.length).toBe(1);
    expect(content.fields[0].key).toBe('amount');
  });

  it('redacts unknown formKey content', () => {
    const raw = { customField: 'customValue', accessToken: 'secret' };
    const mapped = UserTaskMapper.mapContent('CUSTOM_UNSUPPORTED', raw);

    expect(mapped.formKey).toBe('CUSTOM_UNSUPPORTED');
    expect(mapped.content).toBeNull();
  });

  it('treats padded and whitespace-only formKeys as exact unsupported keys', () => {
    const validContent = {
      campaignId: 'camp-1',
      campaignName: 'Campaign',
      niche: 'Beauty',
      targetCount: 2,
      minScore: 80,
      candidates: [],
    };

    const padded = UserTaskMapper.mapContent(' KOC_CANDIDATE_APPROVAL ', validContent);
    const whitespace = UserTaskMapper.mapContent('   ', validContent);

    expect(padded.formKey).toBe(' KOC_CANDIDATE_APPROVAL ');
    expect(padded.content).toBeNull();
    expect(whitespace.formKey).toBe('   ');
    expect(whitespace.content).toBeNull();
  });

  it('returns null for malformed supported content instead of fabricating defaults', () => {
    const mapped = UserTaskMapper.mapContent(
      SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
      {
        campaignId: 'camp-1',
        candidates: [],
      },
    );

    expect(mapped.content).toBeNull();
  });

  it('handles null and non-object content safely without fabricated defaults', () => {
    const mappedNull = UserTaskMapper.mapContent(
      SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
      null,
    );
    expect(mappedNull.content).toBeNull();

    const mappedString = UserTaskMapper.mapContent('ANY_KEY', 'not-an-object');
    expect(mappedString.content).toBeNull();
  });

  it('converts BE UserTaskDetail to TypedUserTaskDetail using nested task.formKey', () => {
    const detail: UserTaskDetail = {
      task: baseTaskSummary,
      supported: true,
      content: {
        campaignId: 'camp-1',
        campaignName: 'Name',
        niche: 'Tech',
        targetCount: 1,
        minScore: 50,
        candidates: [],
      },
      allowedActions: ['APPROVE', 'REJECT'],
      permission: {
        visible: true,
        claimable: false,
        readOnly: false,
        canAct: true,
      },
    };

    const typed = UserTaskMapper.toTypedDetail(detail);
    expect(typed.task.formKey).toBe(SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL);
    expect(typed.task.taskId).toBe('task-100');
    expect(typed.task.taskName).toBe('Approve KOC');
    expect(typed.task.processDefinitionName).toBe('KOC Discovery');
    expect(typed.permission.canAct).toBe(true);
    expect(typed.content).toBeDefined();
    expect((typed.content as KocCandidateApprovalContent).campaignId).toBe('camp-1');
  });
});
