import { describe, expect, it } from 'vitest';
import type {
  BacktestCreateRequestDto,
  QuantBacktestRunSummaryDto,
  QuantRunDetailDto,
  QuantStrategyDto,
} from '../models/quant-backtest.dto';
import type { BacktestCreateFormModel } from '../models/quant-backtest.model';
import {
  extractQuantBffError,
  mapFormToCreateRequestDto,
  mapRunDetailDtoToModel,
  mapRunItemDtoToRecord,
  mapStrategyDtoToRecord,
  parseSchemaProperties,
  resolveJobStatusVariant,
  resolveQuantStatusVariant,
  resolveReturnVariant,
} from './quant-backtest.mapper';

describe('quant-backtest mapper', () => {
  it('maps authoritative Job Service statuses to correct badge variants', () => {
    expect(resolveJobStatusVariant('SUCCESS')).toBe('success');
    expect(resolveJobStatusVariant('RUNNING')).toBe('info');
    expect(resolveJobStatusVariant('FAILED')).toBe('danger');
    expect(resolveJobStatusVariant('TIMEOUT')).toBe('danger');
    expect(resolveJobStatusVariant('CANCELED')).toBe('warning');
    expect(resolveJobStatusVariant('SKIPPED')).toBe('warning');
    expect(resolveJobStatusVariant('PENDING')).toBe('default');
  });

  it('maps quant domain outcome to correct badge variants', () => {
    expect(resolveQuantStatusVariant('COMPLETED')).toBe('success');
    expect(resolveQuantStatusVariant('IN_PROGRESS')).toBe('info');
    expect(resolveQuantStatusVariant('FAILED')).toBe('danger');
    expect(resolveQuantStatusVariant('UNAVAILABLE')).toBe('warning');
    expect(resolveQuantStatusVariant(null)).toBe('muted');
    expect(resolveQuantStatusVariant(undefined)).toBe('muted');
  });

  it('resolves net return semantic variant', () => {
    expect(resolveReturnVariant(12.5)).toBe('positive');
    expect(resolveReturnVariant(-3.2)).toBe('negative');
    expect(resolveReturnVariant(0)).toBe('neutral');
    expect(resolveReturnVariant(null)).toBe('neutral');
  });

  it('maps QuantBacktestRunSummaryDto to RunOverviewRecord preserving authoritative job status', () => {
    const dto: QuantBacktestRunSummaryDto = {
      runId: 'job-run-123',
      jobConfigCode: 'cfg-001',
      name: 'BTC Momentum Test',
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'ict-default',
      datasetVersion: 'binance-usdm-1m-202601-v1',
      instrumentIds: ['BTCUSDT'],
      status: 'SUCCEEDED',
      jobStatus: 'SUCCESS',
      triggerType: 'MANUAL',
      startedAt: '2026-09-08T00:00:00Z',
      finishedAt: '2026-09-08T00:15:00Z',
      durationMs: 900000,
      quantOutcome: 'COMPLETED',
      backtestRunId: 'qbt-run-456',
      summaryMetrics: {
        totalReturn: 0.145,
        maxDrawdown: -4.2,
        winRate: 0.65,
        totalTrades: 40,
      },
    };

    const record = mapRunItemDtoToRecord(dto);
    expect(record.runId).toBe('job-run-123');
    expect(record.backtestRunId).toBe('qbt-run-456');
    expect(record.jobStatus).toBe('SUCCESS');
    expect(record.jobStatusVariant).toBe('success');
    expect(record.quantOutcome).toBe('COMPLETED');
    expect(record.quantStatusVariant).toBe('success');
    expect(record.netReturnVariant).toBe('positive');
    expect(record.instrumentId).toBe('BTCUSDT');
  });

  it('maps QuantRunDetailDto to BacktestRunDetailModel preserving full snapshot and errors', () => {
    const detailDto: QuantRunDetailDto = {
      runId: 'job-run-123',
      jobConfigCode: 'quant-run-cfg-01',
      name: 'Detail Test',
      executionMode: 'RUN_NOW',
      status: 'FAILED',
      jobStatus: 'FAILED',
      triggerType: 'MANUAL',
      startedAt: '2026-09-08T00:00:00Z',
      finishedAt: '2026-09-08T00:05:00Z',
      durationMs: 300000,
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'cfg-default',
      datasetVersion: 'binance-usdm-1m-202601-v1',
      instrumentIds: ['BTCUSDT'],
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T23:59:00.000Z',
      initialCapital: '100000.00',
      simulationConfiguration: {
        intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
        feeModel: 'BINANCE_USDM_V1',
        slippageModel: 'FIXED_BPS',
        slippageBps: '1.0',
      },
      parameters: { swingLeftBars: 3, swingRightBars: 3 },
      quantOutcome: 'FAILED',
      error: {
        code: 'JOB_TIMEOUT',
        message: 'Execution timed out in Job Service',
      },
    };

    const model = mapRunDetailDtoToModel(detailDto);
    expect(model.runId).toBe('job-run-123');
    expect(model.jobStatus).toBe('FAILED');
    expect(model.jobStatusVariant).toBe('danger');
    expect(model.errorCode).toBe('JOB_TIMEOUT');
    expect(model.errorMessage).toBe('Execution timed out in Job Service');
    expect(model.parameters['swingLeftBars']).toBe(3);
  });

  it('maps QuantStrategyDto to StrategyRecord parsing real JSON Schema properties', () => {
    const stratDto: QuantStrategyDto = {
      id: 'ict_liquidity_reversal',
      name: 'ICT Liquidity Reversal',
      description: 'ICT Strategy',
      schema: {
        type: 'object',
        properties: {
          swingLeftBars: {
            type: 'integer',
            title: 'Swing Left Bars',
            default: 3,
            minimum: 1,
            description: 'Bars to the left of swing pivot',
          },
          riskRewardRatio: {
            type: 'number',
            title: 'Risk Reward Ratio',
            default: 2.0,
            minimum: 0.5,
          },
        },
        required: ['swingLeftBars'],
      },
      fields: [],
      parameterFields: [],
      simulationFields: [],
      configs: [
        {
          configId: 'cfg-1',
          strategyId: 'ict_liquidity_reversal',
          name: 'Preset 1',
          parameters: { swingLeftBars: 3 },
          dataRequirements: {},
          simulation: {},
        },
      ],
    };

    const record = mapStrategyDtoToRecord(stratDto);
    expect(record.id).toBe('ict_liquidity_reversal');
    expect(record.configsCount).toBe(1);
    expect(record.parametersCount).toBe(2);
    expect(record.schemaFields[0]?.key).toBe('swingLeftBars');
    expect(record.schemaFields[0]?.required).toBe(true);
    expect(record.schemaFields[1]?.required).toBe(false);
  });

  it('maps BacktestCreateFormModel to BacktestCreateRequestDto', () => {
    const formNow: BacktestCreateFormModel = {
      name: 'Immediate Run',
      executionMode: 'RUN_NOW',
      cron: '0 2 * * *',
      timezone: 'UTC',
      description: 'My test',
      datasetVersion: 'binance-usdm-1m-202601-v1',
      instrumentIds: ['BTCUSDT'],
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T23:59:00.000Z',
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'cfg-default',
      parameters: { swingLeftBars: 4 },
      initialCapital: '100000.00',
      intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
      feeModel: 'BINANCE_USDM_V1',
      slippageModel: 'FIXED_BPS',
      slippageBps: '1.0',
    };

    const nowReq = mapFormToCreateRequestDto(formNow);
    expect(nowReq.executionMode).toBe('RUN_NOW');
    expect(nowReq.schedule).toBeNull();
    expect(nowReq.name).toBe('Immediate Run');

    const formSchedule: BacktestCreateFormModel = {
      ...formNow,
      executionMode: 'SCHEDULE',
      cron: '0 4 * * *',
      timezone: 'UTC',
    };

    const schedReq = mapFormToCreateRequestDto(formSchedule);
    expect(schedReq.executionMode).toBe('SCHEDULE');
    expect(schedReq.schedule).toEqual({ cron: '0 4 * * *', timezone: 'UTC' });
  });

  it('extracts structured error envelopes preserving code and message from BaseResponse', () => {
    const bffError = {
      error: {
        traceId: 'trace-123',
        status: 400,
        errorMessage: 'Invalid request body',
        data: {
          code: 'DATASET_NOT_READY',
          message: 'Dataset is not ready',
          correlationId: 'corr-123',
          fieldErrors: [{ field: 'datasetVersion', message: 'Dataset status is INGESTING' }],
        },
      },
    };

    const parsed = extractQuantBffError(bffError);
    expect(parsed.code).toBe('DATASET_NOT_READY');
    expect(parsed.message).toBe('Dataset is not ready');
    expect(parsed.correlationId).toBe('corr-123');
    expect(parsed.fieldErrors?.length).toBe(1);
  });
});
