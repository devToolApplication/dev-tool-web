import { RuleConfigResponse } from '../../../data-access/models/trading-system.model';

export const SMC_EVENT_TREND_DEPENDENCY_MESSAGE =
  'tradeBot.ruleExpression.validation.smcEventTrendDependency';

const SMC_EVENT_EXECUTORS = new Set([
  'BULLISH_BOS',
  'BEARISH_BOS',
  'BULLISH_CHOCH',
  'BEARISH_CHOCH',
]);

const SMC_TREND_EXECUTORS = new Set(['TREND_IS_BULLISH', 'TREND_IS_BEARISH']);
const SMC_TREND_SLOT_CODES = new Set(['trendisbullish', 'trendisbearish']);

export function isSmcEventExecutor(executor: string | null | undefined): boolean {
  return SMC_EVENT_EXECUTORS.has(normalizeExecutor(executor));
}

export function isSmcTrendDependency(
  currentExecutor: string | null | undefined,
  dependency: {
    ruleCode?: string | null;
    slotCode?: string | null;
    executor?: string | null;
  },
): boolean {
  if (!isSmcEventExecutor(currentExecutor)) {
    return false;
  }

  return (
    SMC_TREND_SLOT_CODES.has(normalizeSlot(dependency.slotCode)) ||
    normalizeExecutor(dependency.ruleCode).startsWith('TREND_IS_') ||
    SMC_TREND_EXECUTORS.has(normalizeExecutor(dependency.executor))
  );
}

export function allowedRuleReference(
  currentExecutor: string | null | undefined,
  rule: RuleConfigResponse,
  slotCode?: string | null,
): boolean {
  return !isSmcTrendDependency(currentExecutor, {
    ruleCode: rule.code,
    slotCode,
    executor: rule.executor,
  });
}

function normalizeExecutor(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function normalizeSlot(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}
