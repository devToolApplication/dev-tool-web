import {
  GenericApprovalContent,
  GenericApprovalField,
  KocCandidateApprovalContent,
  KocCandidateApprovalItem,
  KocCandidatePreviewItem,
  KocDiscoveryDecisionContent,
  Manual2faConfirmationContent,
  SUPPORTED_FORM_KEYS,
  TaskContentUnion,
  TypedUserTaskDetail,
  UserTaskDetail,
} from '../models/user-task.model';

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

function mapCandidate(value: unknown): KocCandidateApprovalItem | null {
  if (
    !isObject(value) ||
    !isString(value['externalProfileId']) ||
    !isString(value['fullName']) ||
    !isString(value['profileUrl']) ||
    !isString(value['platform']) ||
    !isNumber(value['followerCount']) ||
    !isNumber(value['engagementRate']) ||
    !isNumber(value['score']) ||
    !isStringArray(value['strengths']) ||
    !isStringArray(value['risks']) ||
    (value['reviewNote'] !== undefined && !isString(value['reviewNote']))
  ) {
    return null;
  }
  return {
    externalProfileId: value['externalProfileId'],
    fullName: value['fullName'],
    profileUrl: value['profileUrl'],
    platform: value['platform'],
    followerCount: value['followerCount'],
    engagementRate: value['engagementRate'],
    score: value['score'],
    strengths: value['strengths'],
    risks: value['risks'],
    ...(value['reviewNote'] !== undefined ? { reviewNote: value['reviewNote'] } : {}),
  };
}

function mapPreview(value: unknown): KocCandidatePreviewItem | null {
  if (
    !isObject(value) ||
    !isString(value['externalProfileId']) ||
    !isString(value['fullName']) ||
    !isString(value['profileUrl']) ||
    !isString(value['platform']) ||
    !isNumber(value['followerCount']) ||
    !isNumber(value['score'])
  ) {
    return null;
  }
  return {
    externalProfileId: value['externalProfileId'],
    fullName: value['fullName'],
    profileUrl: value['profileUrl'],
    platform: value['platform'],
    followerCount: value['followerCount'],
    score: value['score'],
  };
}

function mapField(value: unknown): GenericApprovalField | null {
  if (
    !isObject(value) ||
    !isString(value['key']) ||
    !isString(value['label']) ||
    !isString(value['value'])
  ) {
    return null;
  }
  return { key: value['key'], label: value['label'], value: value['value'] };
}

function mapKocApproval(raw: JsonObject): KocCandidateApprovalContent | null {
  if (
    !isString(raw['campaignId']) ||
    !isString(raw['campaignName']) ||
    !isString(raw['niche']) ||
    !isNumber(raw['targetCount']) ||
    !isNumber(raw['minScore']) ||
    !Array.isArray(raw['candidates'])
  ) {
    return null;
  }
  const candidates = raw['candidates'].map(mapCandidate);
  if (candidates.some((candidate) => candidate === null)) return null;
  return {
    campaignId: raw['campaignId'],
    campaignName: raw['campaignName'],
    niche: raw['niche'],
    targetCount: raw['targetCount'],
    minScore: raw['minScore'],
    candidates: candidates as KocCandidateApprovalItem[],
  };
}

function mapDiscovery(raw: JsonObject): KocDiscoveryDecisionContent | null {
  if (
    !isString(raw['campaignId']) ||
    !isString(raw['campaignName']) ||
    !isString(raw['niche']) ||
    !isNumber(raw['currentRound']) ||
    !isNumber(raw['roundLimit']) ||
    !isNumber(raw['qualifiedCount']) ||
    !isNumber(raw['targetCount']) ||
    !Array.isArray(raw['candidatePreview'])
  ) {
    return null;
  }
  const candidatePreview = raw['candidatePreview'].map(mapPreview);
  if (candidatePreview.some((candidate) => candidate === null)) return null;
  return {
    campaignId: raw['campaignId'],
    campaignName: raw['campaignName'],
    niche: raw['niche'],
    currentRound: raw['currentRound'],
    roundLimit: raw['roundLimit'],
    qualifiedCount: raw['qualifiedCount'],
    targetCount: raw['targetCount'],
    candidatePreview: candidatePreview as KocCandidatePreviewItem[],
  };
}

function mapManual2fa(raw: JsonObject): Manual2faConfirmationContent | null {
  if (
    !isString(raw['platform']) ||
    !isString(raw['actionRequired']) ||
    !isString(raw['message']) ||
    (raw['verificationNumber'] !== undefined && !isString(raw['verificationNumber']))
  ) {
    return null;
  }
  return {
    platform: raw['platform'],
    actionRequired: raw['actionRequired'],
    message: raw['message'],
    ...(raw['verificationNumber'] !== undefined
      ? { verificationNumber: raw['verificationNumber'] }
      : {}),
  };
}

function mapGeneric(raw: JsonObject): GenericApprovalContent | null {
  if (
    !isString(raw['title']) ||
    !Array.isArray(raw['fields']) ||
    (raw['summary'] !== undefined && !isString(raw['summary'])) ||
    (raw['reference'] !== undefined && !isString(raw['reference'])) ||
    (raw['requester'] !== undefined && !isString(raw['requester'])) ||
    (raw['submittedAt'] !== undefined && !isString(raw['submittedAt']))
  ) {
    return null;
  }
  const fields = raw['fields'].map(mapField);
  if (fields.some((field) => field === null)) return null;
  return {
    title: raw['title'],
    fields: fields as GenericApprovalField[],
    ...(raw['summary'] !== undefined ? { summary: raw['summary'] } : {}),
    ...(raw['reference'] !== undefined ? { reference: raw['reference'] } : {}),
    ...(raw['requester'] !== undefined ? { requester: raw['requester'] } : {}),
    ...(raw['submittedAt'] !== undefined ? { submittedAt: raw['submittedAt'] } : {}),
  };
}

export class UserTaskMapper {
  static mapContent(
    formKey: typeof SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
    rawContent: unknown,
  ): {
    formKey: typeof SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL;
    content: KocCandidateApprovalContent | null;
  };
  static mapContent(
    formKey: typeof SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
    rawContent: unknown,
  ): {
    formKey: typeof SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION;
    content: KocDiscoveryDecisionContent | null;
  };
  static mapContent(
    formKey: typeof SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
    rawContent: unknown,
  ): {
    formKey: typeof SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION;
    content: Manual2faConfirmationContent | null;
  };
  static mapContent(
    formKey: typeof SUPPORTED_FORM_KEYS.APPROVAL,
    rawContent: unknown,
  ): {
    formKey: typeof SUPPORTED_FORM_KEYS.APPROVAL;
    content: GenericApprovalContent | null;
  };
  static mapContent(formKey: string, rawContent: unknown): TaskContentUnion;
  static mapContent(formKey: string, rawContent: unknown): TaskContentUnion {
    if (!isObject(rawContent)) return { formKey, content: null };

    switch (formKey) {
      case SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL:
        return { formKey, content: mapKocApproval(rawContent) };
      case SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION:
        return { formKey, content: mapDiscovery(rawContent) };
      case SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION:
        return { formKey, content: mapManual2fa(rawContent) };
      case SUPPORTED_FORM_KEYS.APPROVAL:
        return { formKey, content: mapGeneric(rawContent) };
      default:
        return { formKey, content: null };
    }
  }

  static toTypedDetail(detail: UserTaskDetail): TypedUserTaskDetail {
    const mapped = this.mapContent(detail.task.formKey, detail.content);
    return { ...detail, content: mapped.content } as TypedUserTaskDetail;
  }
}
