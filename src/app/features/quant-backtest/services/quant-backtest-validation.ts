import type { QuantDatasetDto, QuantStrategyDto } from '../models/quant-backtest.dto';
import type { BacktestCreateFormModel, StrategySchemaField } from '../models/quant-backtest.model';
import { parseSchemaProperties } from './quant-backtest.mapper';

export type CreateValidationErrors = Record<string, string>;

export function validateCreateStep(
  step: number,
  form: BacktestCreateFormModel,
  strategies: QuantStrategyDto[],
  datasets: QuantDatasetDto[],
): CreateValidationErrors {
  const errors: CreateValidationErrors = {};

  if (step === 1) {
    validateSetup(form, errors);
  } else if (step === 2) {
    validateDataset(form, datasets, errors);
  } else if (step === 3) {
    validateStrategy(form, strategies, errors);
  }

  return errors;
}

export function coerceStrategyParameter(
  field: Pick<StrategySchemaField, 'key' | 'type'>,
  value: unknown,
): unknown {
  if (field.type === 'integer' || field.type === 'number') {
    if (value === '' || value === null || value === undefined) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.type === 'boolean') {
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
  }
  return value;
}

function validateSetup(form: BacktestCreateFormModel, errors: CreateValidationErrors): void {
  if (!form.name.trim()) {
    errors['name'] = 'quantBacktest.create.field.nameRequired';
  } else if (form.name.trim().length > 100) {
    errors['name'] = 'quantBacktest.create.field.nameTooLong';
  }

  if (form.executionMode === 'SCHEDULE') {
    if (!form.cron.trim()) {
      errors['cron'] = 'quantBacktest.create.field.cronRequired';
    } else if (!isCronSyntaxValid(form.cron)) {
      errors['cron'] = 'quantBacktest.create.field.cronInvalid';
    }
  }
}

function validateDataset(
  form: BacktestCreateFormModel,
  datasets: QuantDatasetDto[],
  errors: CreateValidationErrors,
): void {
  const dataset = datasets.find(
    (candidate) => candidate.datasetVersion === form.datasetVersion && candidate.status === 'READY',
  );
  if (!dataset) {
    errors['datasetVersion'] = 'quantBacktest.create.field.datasetNotReady';
    return;
  }

  if (!form.instrumentIds.length) {
    errors['instrumentIds'] = 'quantBacktest.create.field.instrumentsRequired';
  } else if (form.instrumentIds.length !== 1) {
    errors['instrumentIds'] = 'quantBacktest.create.field.instrumentExactlyOne';
  } else if (
    form.instrumentIds.some((instrumentId) => !dataset.instrumentIds.includes(instrumentId))
  ) {
    errors['instrumentIds'] = 'quantBacktest.create.field.instrumentUnavailable';
  }

  const start = parseIsoDate(form.start);
  const end = parseIsoDate(form.end);
  if (!start) {
    errors['start'] = form.start
      ? 'quantBacktest.create.field.startInvalid'
      : 'quantBacktest.create.field.startRequired';
  }
  if (!end) {
    errors['end'] = form.end
      ? 'quantBacktest.create.field.endInvalid'
      : 'quantBacktest.create.field.endRequired';
  }
  if (!start || !end) {
    return;
  }
  if (end.getTime() <= start.getTime()) {
    errors['end'] = 'quantBacktest.create.field.endAfterStart';
    return;
  }

  const coverageStart = new Date(dataset.start).getTime();
  const coverageEnd = new Date(dataset.end).getTime();
  if (start.getTime() < coverageStart) {
    errors['start'] = 'quantBacktest.create.field.rangeOutsideDataset';
  }
  if (end.getTime() > coverageEnd) {
    errors['end'] = 'quantBacktest.create.field.rangeOutsideDataset';
  }
}

function validateStrategy(
  form: BacktestCreateFormModel,
  strategies: QuantStrategyDto[],
  errors: CreateValidationErrors,
): void {
  const strategy = strategies.find((candidate) => candidate.id === form.strategyId);
  if (!strategy) {
    errors['strategyId'] = 'quantBacktest.create.field.strategyRequired';
    return;
  }

  const config = strategy.configs.find(
    (candidate) =>
      candidate.configId === form.strategyConfigId && candidate.strategyId === strategy.id,
  );
  if (!config) {
    errors['strategyConfigId'] = 'quantBacktest.create.field.strategyConfigInvalid';
  }

  const capital = Number(form.initialCapital);
  if (!Number.isFinite(capital) || capital <= 0) {
    errors['initialCapital'] = 'quantBacktest.create.field.initialCapitalRequired';
  }

  validateSimulationField(
    strategy,
    'intrabar_policy',
    form.intrabarPolicy,
    'intrabarPolicy',
    errors,
  );
  validateSimulationField(strategy, 'fee_model', form.feeModel, 'feeModel', errors);
  validateSimulationField(strategy, 'slippage_model', form.slippageModel, 'slippageModel', errors);

  const slippage = Number(form.slippageBps);
  const slippageMetadata = strategy.simulationFields.find((field) => field.name === 'slippage_bps');
  if (
    !Number.isFinite(slippage) ||
    slippage < (slippageMetadata?.min_value ?? 0) ||
    (slippageMetadata?.max_value !== undefined && slippage > slippageMetadata.max_value)
  ) {
    errors['slippageBps'] = 'quantBacktest.create.field.slippageInvalid';
  }

  validateSchemaParameters(parseSchemaProperties(strategy.schema), form.parameters, errors);
}

function validateSimulationField(
  strategy: QuantStrategyDto,
  metadataName: string,
  value: string,
  errorField: string,
  errors: CreateValidationErrors,
): void {
  const metadata = strategy.simulationFields.find((field) => field.name === metadataName);
  const options = metadata?.options;
  if (!metadata || !options?.includes(value)) {
    errors[errorField] = 'quantBacktest.create.field.simulationValueInvalid';
  }
}

function validateSchemaParameters(
  fields: StrategySchemaField[],
  parameters: Record<string, unknown>,
  errors: CreateValidationErrors,
): void {
  for (const field of fields) {
    const value = parameters[field.key];
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.key] = 'quantBacktest.create.field.parameterRequired';
      continue;
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (field.type === 'boolean' && typeof value !== 'boolean') {
      errors[field.key] = 'quantBacktest.create.field.parameterBoolean';
      continue;
    }
    if (field.type !== 'integer' && field.type !== 'number') {
      continue;
    }

    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) {
      errors[field.key] = 'quantBacktest.create.field.parameterNumber';
    } else if (field.type === 'integer' && !Number.isInteger(numberValue)) {
      errors[field.key] = 'quantBacktest.create.field.parameterInteger';
    } else if (field.min !== undefined && numberValue < field.min) {
      errors[field.key] = 'quantBacktest.create.field.parameterMinimum';
    } else if (field.max !== undefined && numberValue > field.max) {
      errors[field.key] = 'quantBacktest.create.field.parameterMaximum';
    }
  }
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isCronSyntaxValid(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return false;
  }
  return parts.every((part) => /^[0-9*/?,LW#-]+$/i.test(part));
}
