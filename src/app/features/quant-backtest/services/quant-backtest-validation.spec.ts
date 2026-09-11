import { describe, expect, it } from 'vitest';
import type { QuantDatasetDto, QuantStrategyDto } from '../models/quant-backtest.dto';
import type { BacktestCreateFormModel } from '../models/quant-backtest.model';
import { coerceStrategyParameter, validateCreateStep } from './quant-backtest-validation';

const strategy: QuantStrategyDto = {
  id: 'ict_liquidity_reversal',
  name: 'ICT Liquidity Reversal',
  description: 'ICT strategy',
  schema: {
    type: 'object',
    properties: {
      swingLeftBars: { type: 'integer', minimum: 1, default: 3 },
      riskPerTradePct: { type: 'number', minimum: 0.1, maximum: 5, default: 1 },
      chochBodyClose: { type: 'boolean', default: true },
    },
    required: ['swingLeftBars'],
  },
  fields: [],
  parameterFields: [],
  simulationFields: [
    {
      name: 'initial_capital',
      label: 'Initial Capital',
      type: 'number',
      default: 100000,
      required: true,
      min_value: 1,
    },
    {
      name: 'intrabar_policy',
      label: 'Intrabar Policy',
      type: 'select',
      default: 'CONSERVATIVE_STOP_FIRST',
      required: true,
      options: ['CONSERVATIVE_STOP_FIRST'],
    },
    {
      name: 'fee_model',
      label: 'Fee Model',
      type: 'select',
      default: 'BINANCE_USDM_V1',
      required: true,
      options: ['BINANCE_USDM_V1'],
    },
    {
      name: 'slippage_model',
      label: 'Slippage Model',
      type: 'select',
      default: 'FIXED_BPS',
      required: true,
      options: ['FIXED_BPS'],
    },
    {
      name: 'slippage_bps',
      label: 'Slippage Basis Points',
      type: 'number',
      default: 1,
      required: false,
      min_value: 0,
      max_value: 100,
    },
  ],
  configs: [
    {
      configId: 'ict-default',
      strategyId: 'ict_liquidity_reversal',
      name: 'Default',
      parameters: {
        swingLeftBars: 3,
        riskPerTradePct: 1,
        chochBodyClose: true,
      },
      dataRequirements: { base_timeframe: '1m' },
      simulation: {
        intrabar_policy: 'CONSERVATIVE_STOP_FIRST',
        fee_model: 'BINANCE_USDM_V1',
        slippage_model: 'FIXED_BPS',
      },
    },
  ],
};

const dataset: QuantDatasetDto = {
  datasetVersion: 'dataset-1',
  provider: 'BINANCE',
  venue: 'BINANCE_USDM',
  assetClass: 'CRYPTO_FUTURES',
  instrumentIds: ['BTCUSDT-PERP'],
  timeframe: '1m',
  start: '2026-01-01T00:00:00.000Z',
  end: '2026-01-31T23:59:00.000Z',
  barCount: 44640,
  timezone: 'UTC',
  status: 'READY',
  createdAt: '2026-02-01T00:00:00.000Z',
};

function validForm(): BacktestCreateFormModel {
  return {
    name: 'BTC test',
    executionMode: 'RUN_NOW',
    cron: '0 2 * * *',
    timezone: 'UTC',
    description: '',
    datasetVersion: dataset.datasetVersion,
    instrumentIds: [...dataset.instrumentIds],
    start: dataset.start,
    end: dataset.end,
    strategyId: strategy.id,
    strategyConfigId: strategy.configs[0]!.configId,
    parameters: {
      swingLeftBars: 3,
      riskPerTradePct: 1,
      chochBodyClose: true,
    },
    initialCapital: '100000',
    intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
    feeModel: 'BINANCE_USDM_V1',
    slippageModel: 'FIXED_BPS',
    slippageBps: '1',
  };
}

describe('quant backtest create validation', () => {
  it('rejects invalid schedule cron syntax', () => {
    const form = { ...validForm(), executionMode: 'SCHEDULE' as const, cron: 'bad cron' };
    const errors = validateCreateStep(1, form, [strategy], [dataset]);
    expect(errors['cron']).toBe('quantBacktest.create.field.cronInvalid');
  });

  it('allows exactly one instrument and rejects multiple or empty selections', () => {
    const empty = validateCreateStep(
      2,
      { ...validForm(), instrumentIds: [] },
      [strategy],
      [dataset],
    );
    expect(empty['instrumentIds']).toBe('quantBacktest.create.field.instrumentsRequired');

    const multiple = validateCreateStep(
      2,
      { ...validForm(), instrumentIds: ['BTCUSDT-PERP', 'ETHUSDT-PERP'] },
      [strategy],
      [dataset],
    );
    expect(multiple['instrumentIds']).toBe('quantBacktest.create.field.instrumentExactlyOne');

    const validOne = validateCreateStep(
      2,
      { ...validForm(), instrumentIds: ['BTCUSDT-PERP'] },
      [strategy],
      [dataset],
    );
    expect(validOne['instrumentIds']).toBeUndefined();
  });

  it('requires a READY dataset membership and instruments within its contract', () => {
    const missing = validateCreateStep(
      2,
      { ...validForm(), datasetVersion: 'not-loaded' },
      [strategy],
      [dataset],
    );
    expect(missing['datasetVersion']).toBe('quantBacktest.create.field.datasetNotReady');

    const invalidInstrument = validateCreateStep(
      2,
      { ...validForm(), instrumentIds: ['ETHUSDT-PERP'] },
      [strategy],
      [dataset],
    );
    expect(invalidInstrument['instrumentIds']).toBe(
      'quantBacktest.create.field.instrumentUnavailable',
    );
  });

  it('rejects invalid, reversed, and out-of-coverage date ranges', () => {
    expect(
      validateCreateStep(2, { ...validForm(), start: 'not-a-date' }, [strategy], [dataset])[
        'start'
      ],
    ).toBe('quantBacktest.create.field.startInvalid');

    expect(
      validateCreateStep(
        2,
        {
          ...validForm(),
          start: '2026-01-20T00:00:00.000Z',
          end: '2026-01-10T00:00:00.000Z',
        },
        [strategy],
        [dataset],
      )['end'],
    ).toBe('quantBacktest.create.field.endAfterStart');

    expect(
      validateCreateStep(
        2,
        { ...validForm(), end: '2026-02-01T00:00:00.000Z' },
        [strategy],
        [dataset],
      )['end'],
    ).toBe('quantBacktest.create.field.rangeOutsideDataset');
  });

  it('requires selected configuration ownership and supported simulation metadata', () => {
    const wrongConfig = validateCreateStep(
      3,
      { ...validForm(), strategyConfigId: 'other-config' },
      [strategy],
      [dataset],
    );
    expect(wrongConfig['strategyConfigId']).toBe(
      'quantBacktest.create.field.strategyConfigInvalid',
    );

    const unsupportedSimulation = validateCreateStep(
      3,
      {
        ...validForm(),
        intrabarPolicy: 'OPTIMISTIC_LIMIT_FIRST',
        feeModel: 'ZERO_FEE',
        slippageModel: 'NONE',
      },
      [strategy],
      [dataset],
    );
    expect(unsupportedSimulation['intrabarPolicy']).toBe(
      'quantBacktest.create.field.simulationValueInvalid',
    );
    expect(unsupportedSimulation['feeModel']).toBe(
      'quantBacktest.create.field.simulationValueInvalid',
    );
    expect(unsupportedSimulation['slippageModel']).toBe(
      'quantBacktest.create.field.simulationValueInvalid',
    );
  });

  it('validates capital, slippage, and JSON schema constraints', () => {
    const errors = validateCreateStep(
      3,
      {
        ...validForm(),
        initialCapital: '0',
        slippageBps: '101',
        parameters: {
          swingLeftBars: 1.5,
          riskPerTradePct: 7,
          chochBodyClose: 'yes',
        },
      },
      [strategy],
      [dataset],
    );

    expect(errors['initialCapital']).toBe('quantBacktest.create.field.initialCapitalRequired');
    expect(errors['slippageBps']).toBe('quantBacktest.create.field.slippageInvalid');
    expect(errors['swingLeftBars']).toBe('quantBacktest.create.field.parameterInteger');
    expect(errors['riskPerTradePct']).toBe('quantBacktest.create.field.parameterMaximum');
    expect(errors['chochBodyClose']).toBe('quantBacktest.create.field.parameterBoolean');
  });

  it('coerces typed schema values without changing free-form strings', () => {
    expect(coerceStrategyParameter({ key: 'count', type: 'integer' }, '4')).toBe(4);
    expect(coerceStrategyParameter({ key: 'risk', type: 'number' }, '1.25')).toBe(1.25);
    expect(coerceStrategyParameter({ key: 'enabled', type: 'boolean' }, 'true')).toBe(true);
    expect(coerceStrategyParameter({ key: 'name', type: 'string' }, 'alpha')).toBe('alpha');
  });
});
