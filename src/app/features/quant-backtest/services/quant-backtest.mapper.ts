import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type {
  BacktestCreateRequestDto,
  JobRunStatus,
  QuantBacktestRunSummaryDto,
  QuantBffErrorEnvelope,
  QuantRunDetailDto,
  QuantStrategyDto,
} from '../models/quant-backtest.dto';
import type {
  BacktestCreateFormModel,
  BacktestRunDetailModel,
  RunOverviewRecord,
  StrategyRecord,
  StrategySchemaField,
} from '../models/quant-backtest.model';

export function resolveJobStatusVariant(status: JobRunStatus): BadgeVariant {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'RUNNING':
      return 'info';
    case 'FAILED':
    case 'TIMEOUT':
      return 'danger';
    case 'CANCELED':
    case 'SKIPPED':
      return 'warning';
    case 'PENDING':
    default:
      return 'default';
  }
}

export function resolveQuantStatusVariant(status?: string | null): BadgeVariant {
  if (!status) {
    return 'muted';
  }
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'info';
    case 'FAILED':
      return 'danger';
    case 'UNAVAILABLE':
    default:
      return 'warning';
  }
}

export function resolveReturnVariant(value?: number | null): 'positive' | 'negative' | 'neutral' {
  if (value == null || Number.isNaN(value) || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'positive' : 'negative';
}

export function mapRunItemDtoToRecord(dto: QuantBacktestRunSummaryDto): RunOverviewRecord {
  const netReturn = dto.summaryMetrics?.totalReturn ?? null;
  const maxDrawdown = dto.summaryMetrics?.maxDrawdown ?? null;
  const tradesCount = dto.summaryMetrics?.totalTrades ?? null;
  const winRate = dto.summaryMetrics?.winRate ?? null;

  return {
    runId: dto.runId,
    jobConfigCode: dto.jobConfigCode,
    name: dto.name ?? dto.jobConfigCode,
    strategyId: dto.strategyId ?? '',
    strategyConfigId: dto.strategyConfigId ?? '',
    datasetVersion: dto.datasetVersion ?? '',
    instrumentIds: dto.instrumentIds ?? [],
    instrumentId: dto.instrumentIds?.[0] ?? '',
    jobStatus: dto.jobStatus,
    quantOutcome: dto.quantOutcome ?? null,
    quantStatus: dto.quantStatus ?? null,
    backtestRunId: dto.backtestRunId ?? null,
    startedAt: dto.startedAt ?? null,
    finishedAt: dto.finishedAt ?? null,
    durationMs: dto.durationMs ?? null,
    triggerType: dto.triggerType,
    netReturn,
    maxDrawdown,
    tradesCount,
    winRate,
    jobStatusVariant: resolveJobStatusVariant(dto.jobStatus),
    quantStatusVariant: resolveQuantStatusVariant(dto.quantOutcome),
    netReturnVariant: resolveReturnVariant(netReturn),
  };
}

export function mapRunDetailDtoToModel(dto: QuantRunDetailDto): BacktestRunDetailModel {
  return {
    runId: dto.runId,
    jobConfigCode: dto.jobConfigCode,
    name: dto.name ?? dto.jobConfigCode,
    executionMode: dto.executionMode,
    jobStatus: dto.jobStatus,
    triggerType: dto.triggerType,
    startedAt: dto.startedAt ?? null,
    finishedAt: dto.finishedAt ?? null,
    durationMs: dto.durationMs ?? null,
    strategyId: dto.strategyId ?? '',
    strategyConfigId: dto.strategyConfigId ?? '',
    datasetVersion: dto.datasetVersion ?? '',
    instrumentIds: dto.instrumentIds ?? [],
    start: dto.start ?? '',
    end: dto.end ?? '',
    initialCapital: dto.initialCapital ?? '',
    simulationConfiguration: dto.simulationConfiguration ?? {},
    parameters: dto.parameters ?? {},
    backtestRunId: dto.backtestRunId ?? null,
    quantOutcome: dto.quantOutcome,
    quantStatus: dto.quantStatus ?? null,
    summaryMetrics: dto.summaryMetrics ?? null,
    errorMessage: dto.error?.message ?? dto.quantError?.message ?? null,
    errorCode: dto.error?.code ?? dto.quantError?.code ?? null,
    jobStatusVariant: resolveJobStatusVariant(dto.jobStatus),
    quantStatusVariant: resolveQuantStatusVariant(dto.quantOutcome),
  };
}

export function parseSchemaProperties(
  parametersSchema?: Record<string, unknown>,
): StrategySchemaField[] {
  if (!parametersSchema || typeof parametersSchema !== 'object') {
    return [];
  }
  const properties = parametersSchema['properties'] as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!properties || typeof properties !== 'object') {
    return [];
  }

  const requiredList = Array.isArray(parametersSchema['required'])
    ? (parametersSchema['required'] as string[])
    : [];

  return Object.entries(properties).map(([key, prop]) => ({
    key,
    label: typeof prop['title'] === 'string' ? prop['title'] : key,
    type: typeof prop['type'] === 'string' ? prop['type'] : 'string',
    defaultValue: prop['default'],
    min: typeof prop['minimum'] === 'number' ? prop['minimum'] : undefined,
    max: typeof prop['maximum'] === 'number' ? prop['maximum'] : undefined,
    step: prop['type'] === 'integer' ? 1 : 0.1,
    required: requiredList.includes(key),
    description: typeof prop['description'] === 'string' ? prop['description'] : undefined,
  }));
}

export function mapStrategyDtoToRecord(dto: QuantStrategyDto): StrategyRecord {
  const schemaFields = parseSchemaProperties(dto.schema);
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    schema: dto.schema ?? {},
    configs: dto.configs ?? [],
    configsCount: dto.configs.length,
    parametersCount: schemaFields.length,
    schemaFields,
    dataRequirements: dto.configs.map((config) => config.dataRequirements),
    simulationFields: dto.simulationFields,
  };
}

export function mapFormToCreateRequestDto(form: BacktestCreateFormModel): BacktestCreateRequestDto {
  const isSchedule = form.executionMode === 'SCHEDULE';
  return {
    name: form.name.trim(),
    executionMode: form.executionMode,
    schedule: isSchedule
      ? {
          cron: form.cron.trim(),
          timezone: form.timezone ? form.timezone.trim() : 'UTC',
        }
      : null,
    description: form.description ? form.description.trim() : undefined,
    strategyId: form.strategyId,
    strategyConfigId: form.strategyConfigId,
    datasetVersion: form.datasetVersion,
    instrumentIds: form.instrumentIds,
    start: form.start,
    end: form.end,
    initialCapital: form.initialCapital,
    simulationConfiguration: {
      intrabarPolicy: form.intrabarPolicy,
      feeModel: form.feeModel,
      slippageModel: form.slippageModel,
      slippageBps: form.slippageBps,
    },
    parameters: form.parameters ?? {},
  };
}

export function extractQuantBffError(error: unknown): QuantBffErrorEnvelope {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
    };
  }

  // Check HttpErrorResponse.error
  const errObj = (error as { error?: unknown }).error ?? error;
  if (typeof errObj === 'object' && errObj !== null) {
    const candidate = errObj as Record<string, unknown>;

    // If wrapped in BaseResponse or contains nested data envelope
    const dataObj =
      candidate['data'] && typeof candidate['data'] === 'object'
        ? (candidate['data'] as Record<string, unknown>)
        : candidate;

    const code =
      typeof dataObj['code'] === 'string'
        ? dataObj['code']
        : typeof candidate['errorCode'] === 'string'
          ? candidate['errorCode']
          : 'SERVER_ERROR';

    const message =
      typeof dataObj['message'] === 'string'
        ? dataObj['message']
        : typeof candidate['errorMessage'] === 'string'
          ? candidate['errorMessage']
          : typeof candidate['message'] === 'string'
            ? (candidate['message'] as string)
            : 'Server communication error';

    const correlationId =
      typeof dataObj['correlationId'] === 'string'
        ? dataObj['correlationId']
        : typeof candidate['traceId'] === 'string'
          ? candidate['traceId']
          : undefined;

    const fieldErrors = Array.isArray(dataObj['fieldErrors'])
      ? (dataObj['fieldErrors'] as Array<{ field: string; message: string }>)
      : undefined;

    return {
      code,
      message,
      correlationId,
      fieldErrors,
    };
  }

  if (typeof (error as { message?: unknown }).message === 'string') {
    return {
      code: 'NETWORK_ERROR',
      message: (error as { message: string }).message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  };
}
