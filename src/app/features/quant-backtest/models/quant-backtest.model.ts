import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type {
  ExecutionMode,
  JobRunStatus,
  QuantOutcome,
  QuantStrategyConfigDto,
  QuantSummaryMetricsDto,
  SimulationConfigurationDto,
  TriggerType,
} from './quant-backtest.dto';

export interface RunOverviewRecord {
  runId: string;
  jobConfigCode: string;
  name: string;
  strategyId: string;
  strategyConfigId: string;
  datasetVersion: string;
  instrumentIds: string[];
  instrumentId: string;
  jobStatus: JobRunStatus;
  quantOutcome: string | null;
  quantStatus: string | null;
  backtestRunId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  triggerType: TriggerType;
  netReturn: number | null;
  maxDrawdown: number | null;
  tradesCount: number | null;
  winRate: number | null;
  jobStatusVariant: BadgeVariant;
  quantStatusVariant: BadgeVariant;
  netReturnVariant: 'positive' | 'negative' | 'neutral';
}

export interface RunsSummaryMetrics {
  running: number;
  completed: number;
  winRate: number;
  netReturn: number;
}

export interface BacktestCreateFormModel {
  name: string;
  executionMode: ExecutionMode;
  cron: string;
  timezone: string;
  description: string;
  datasetVersion: string;
  instrumentIds: string[];
  start: string;
  end: string;
  strategyId: string;
  strategyConfigId: string;
  parameters: Record<string, unknown>;
  initialCapital: string;
  intrabarPolicy: string;
  feeModel: string;
  slippageModel: string;
  slippageBps: string;
}

export interface BacktestRunDetailModel {
  runId: string;
  jobConfigCode: string;
  name: string;
  executionMode: ExecutionMode;
  jobStatus: JobRunStatus;
  triggerType: TriggerType;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  strategyId: string;
  strategyConfigId: string;
  datasetVersion: string;
  instrumentIds: string[];
  start: string;
  end: string;
  initialCapital: string;
  simulationConfiguration: Record<string, unknown>;
  parameters: Record<string, unknown>;
  backtestRunId: string | null;
  quantOutcome: QuantOutcome;
  quantStatus: string | null;
  summaryMetrics: QuantSummaryMetricsDto | null;
  errorMessage: string | null;
  errorCode: string | null;
  jobStatusVariant: BadgeVariant;
  quantStatusVariant: BadgeVariant;
}

export interface StrategySchemaField {
  key: string;
  label: string;
  type: string;
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  description?: string;
}

export interface StrategyRecord {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
  configs: QuantStrategyConfigDto[];
  configsCount: number;
  parametersCount: number;
  schemaFields: StrategySchemaField[];
  dataRequirements: Record<string, unknown>[];
  simulationFields: Array<Record<string, unknown>>;
}

export interface ReadyDatasetRecord {
  datasetVersion: string;
  provider: string;
  venue: string;
  assetClass: string;
  instrumentIds: string[];
  timeframe: string;
  timezone: string;
  status: 'READY';
  barCount: number;
  start: string;
  end: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface CursorPageModel<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
