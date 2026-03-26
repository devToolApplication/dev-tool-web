import { FormConfig } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import {
  STRATEGY_TIMEFRAME_OPTIONS,
  STRATEGY_TIMEZONE_OPTIONS,
  StrategyTimeframe,
  StrategyTimezone,
  TradeBotTextKey
} from './strategy-ui.enums';

export interface StrategyConfigDefinition {
  formConfig: FormConfig;
  initialValue: Record<string, unknown>;
}

const required = (labelKey: string) => [Rules.required(labelKey)];

function baseSessionFields() {
  return {
    timezone: {
      type: 'select' as const,
      name: 'timezone',
      label: TradeBotTextKey.Timezone,
      width: '1/3' as const,
      options: STRATEGY_TIMEZONE_OPTIONS,
      validation: required(TradeBotTextKey.Timezone)
    },
    baseTimeframe: {
      type: 'select' as const,
      name: 'baseTimeframe',
      label: TradeBotTextKey.BaseTimeframe,
      width: '1/3' as const,
      options: STRATEGY_TIMEFRAME_OPTIONS,
      validation: required(TradeBotTextKey.BaseTimeframe)
    },
    triggerTimeframe: {
      type: 'select' as const,
      name: 'triggerTimeframe',
      label: TradeBotTextKey.TriggerTimeframe,
      width: '1/3' as const,
      options: STRATEGY_TIMEFRAME_OPTIONS,
      validation: required(TradeBotTextKey.TriggerTimeframe)
    }
  };
}

export function buildStrategySpecificConfigDefinition(strategyCode: string): StrategyConfigDefinition {
  const base = baseSessionFields();

  switch (strategyCode) {
    case 'FIRST_M15_NEWYORK':
      return {
        formConfig: {
          fields: [
            base.timezone,
            { type: 'text', name: 'firstM15CandleStart', label: TradeBotTextKey.FirstM15Start, width: '1/3', validation: required(TradeBotTextKey.FirstM15Start) },
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'checkbox', name: 'breakoutConfirmByClose', label: TradeBotTextKey.BreakoutConfirmByClose, width: '1/3' }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.AMERICA_NEW_YORK,
          firstM15CandleStart: '09:30',
          baseTimeframe: StrategyTimeframe.M15,
          triggerTimeframe: StrategyTimeframe.M5,
          breakoutConfirmByClose: true
        }
      };
    case 'EMA_PULLBACK_TREND':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'trendEmaPeriod', label: TradeBotTextKey.TrendEmaPeriod, width: '1/3', validation: required(TradeBotTextKey.TrendEmaPeriod) },
            { type: 'number', name: 'pullbackEmaPeriod', label: TradeBotTextKey.PullbackEmaPeriod, width: '1/3', validation: required(TradeBotTextKey.PullbackEmaPeriod) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.H1,
          triggerTimeframe: StrategyTimeframe.M15,
          trendEmaPeriod: 200,
          pullbackEmaPeriod: 20
        }
      };
    case 'OPENING_RANGE_BREAKOUT':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'text', name: 'sessionStart', label: TradeBotTextKey.SessionStart, width: '1/3', validation: required(TradeBotTextKey.SessionStart) },
            { type: 'number', name: 'rangeMinutes', label: TradeBotTextKey.RangeMinutes, width: '1/3', validation: required(TradeBotTextKey.RangeMinutes) },
            { type: 'checkbox', name: 'breakoutConfirmByClose', label: TradeBotTextKey.BreakoutConfirmByClose, width: '1/3' }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.AMERICA_NEW_YORK,
          baseTimeframe: StrategyTimeframe.M5,
          triggerTimeframe: StrategyTimeframe.M5,
          sessionStart: '09:30',
          rangeMinutes: 30,
          breakoutConfirmByClose: true
        }
      };
    case 'PREV_DAY_HIGH_LOW_RETEST':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'retestWindowCandles', label: TradeBotTextKey.RetestWindowCandles, width: '1/3', validation: required(TradeBotTextKey.RetestWindowCandles) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.D1,
          triggerTimeframe: StrategyTimeframe.M15,
          retestWindowCandles: 12
        }
      };
    case 'DONCHIAN_BREAKOUT_20':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'channelLookback', label: TradeBotTextKey.ChannelLookback, width: '1/3', validation: required(TradeBotTextKey.ChannelLookback) },
            { type: 'number', name: 'atrPeriod', label: TradeBotTextKey.AtrPeriod, width: '1/3', validation: required(TradeBotTextKey.AtrPeriod) },
            { type: 'number', name: 'atrSlMultiplier', label: TradeBotTextKey.AtrSlMultiplier, width: '1/3', validation: required(TradeBotTextKey.AtrSlMultiplier) },
            { type: 'checkbox', name: 'breakoutConfirmByClose', label: TradeBotTextKey.BreakoutConfirmByClose, width: '1/3' }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.H1,
          triggerTimeframe: StrategyTimeframe.H1,
          channelLookback: 20,
          atrPeriod: 14,
          atrSlMultiplier: 1.5,
          breakoutConfirmByClose: true
        }
      };
    case 'BOLLINGER_RSI_MEAN_REVERSION':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'bbPeriod', label: TradeBotTextKey.BbPeriod, width: '1/3', validation: required(TradeBotTextKey.BbPeriod) },
            { type: 'number', name: 'bbStdDev', label: TradeBotTextKey.BbStdDev, width: '1/3', validation: required(TradeBotTextKey.BbStdDev) },
            { type: 'number', name: 'rsiPeriod', label: TradeBotTextKey.RsiPeriod, width: '1/3', validation: required(TradeBotTextKey.RsiPeriod) },
            { type: 'number', name: 'rsiOverbought', label: TradeBotTextKey.RsiOverbought, width: '1/3', validation: required(TradeBotTextKey.RsiOverbought) },
            { type: 'number', name: 'rsiOversold', label: TradeBotTextKey.RsiOversold, width: '1/3', validation: required(TradeBotTextKey.RsiOversold) },
            { type: 'number', name: 'atrPeriod', label: TradeBotTextKey.AtrPeriod, width: '1/3', validation: required(TradeBotTextKey.AtrPeriod) },
            { type: 'number', name: 'atrSlMultiplier', label: TradeBotTextKey.AtrSlMultiplier, width: '1/3', validation: required(TradeBotTextKey.AtrSlMultiplier) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.M15,
          triggerTimeframe: StrategyTimeframe.M15,
          bbPeriod: 20,
          bbStdDev: 2,
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          atrPeriod: 14,
          atrSlMultiplier: 1
        }
      };
    case 'VWAP_PULLBACK_INTRADAY':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'text', name: 'sessionStart', label: TradeBotTextKey.SessionStart, width: '1/3', validation: required(TradeBotTextKey.SessionStart) },
            { type: 'text', name: 'sessionEnd', label: TradeBotTextKey.SessionEnd, width: '1/3', validation: required(TradeBotTextKey.SessionEnd) },
            { type: 'number', name: 'minDistanceFromVwapPct', label: TradeBotTextKey.MinDistanceFromVwapPct, width: '1/3' }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.M5,
          triggerTimeframe: StrategyTimeframe.M5,
          sessionStart: '00:00',
          sessionEnd: '23:59',
          minDistanceFromVwapPct: 0
        }
      };
    case 'ASIA_RANGE_LONDON_BREAKOUT':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'text', name: 'asiaStart', label: TradeBotTextKey.AsiaStart, width: '1/3', validation: required(TradeBotTextKey.AsiaStart) },
            { type: 'text', name: 'asiaEnd', label: TradeBotTextKey.AsiaEnd, width: '1/3', validation: required(TradeBotTextKey.AsiaEnd) },
            { type: 'text', name: 'londonStart', label: TradeBotTextKey.LondonStart, width: '1/3', validation: required(TradeBotTextKey.LondonStart) },
            { type: 'number', name: 'retestWindowCandles', label: TradeBotTextKey.RetestWindowCandles, width: '1/3', validation: required(TradeBotTextKey.RetestWindowCandles) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.EUROPE_LONDON,
          baseTimeframe: StrategyTimeframe.M15,
          triggerTimeframe: StrategyTimeframe.M5,
          asiaStart: '00:00',
          asiaEnd: '06:00',
          londonStart: '08:00',
          retestWindowCandles: 12
        }
      };
    case 'INSIDE_BAR_BREAKOUT_MTF':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'motherBarLookback', label: TradeBotTextKey.MotherBarLookback, width: '1/3', validation: required(TradeBotTextKey.MotherBarLookback) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.H1,
          triggerTimeframe: StrategyTimeframe.M15,
          motherBarLookback: 24
        }
      };
    case 'RSI_DIVERGENCE_SWING':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'rsiPeriod', label: TradeBotTextKey.RsiPeriod, width: '1/3', validation: required(TradeBotTextKey.RsiPeriod) },
            { type: 'number', name: 'pivotLeft', label: TradeBotTextKey.PivotLeft, width: '1/3', validation: required(TradeBotTextKey.PivotLeft) },
            { type: 'number', name: 'pivotRight', label: TradeBotTextKey.PivotRight, width: '1/3', validation: required(TradeBotTextKey.PivotRight) },
            { type: 'number', name: 'minBarsBetweenPivots', label: TradeBotTextKey.MinBarsBetweenPivots, width: '1/3', validation: required(TradeBotTextKey.MinBarsBetweenPivots) },
            { type: 'number', name: 'maxBarsBetweenPivots', label: TradeBotTextKey.MaxBarsBetweenPivots, width: '1/3', validation: required(TradeBotTextKey.MaxBarsBetweenPivots) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.M15,
          triggerTimeframe: StrategyTimeframe.M15,
          rsiPeriod: 14,
          pivotLeft: 2,
          pivotRight: 2,
          minBarsBetweenPivots: 5,
          maxBarsBetweenPivots: 40
        }
      };
    case 'LIQUIDITY_SWEEP_FVG_RECLAIM':
      return {
        formConfig: {
          fields: [
            base.timezone,
            base.baseTimeframe,
            base.triggerTimeframe,
            { type: 'number', name: 'liquidityLookback', label: TradeBotTextKey.LiquidityLookback, width: '1/3', validation: required(TradeBotTextKey.LiquidityLookback) },
            { type: 'number', name: 'fvgMinGapRatio', label: TradeBotTextKey.FvgMinGapRatio, width: '1/3', validation: required(TradeBotTextKey.FvgMinGapRatio) },
            { type: 'number', name: 'reclaimWindowCandles', label: TradeBotTextKey.ReclaimWindowCandles, width: '1/3', validation: required(TradeBotTextKey.ReclaimWindowCandles) }
          ]
        },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.M5,
          triggerTimeframe: StrategyTimeframe.M5,
          liquidityLookback: 20,
          fvgMinGapRatio: 0.0003,
          reclaimWindowCandles: 6
        }
      };
    default:
      return {
        formConfig: { fields: [base.timezone, base.baseTimeframe, base.triggerTimeframe] },
        initialValue: {
          timezone: StrategyTimezone.UTC,
          baseTimeframe: StrategyTimeframe.M15,
          triggerTimeframe: StrategyTimeframe.M5
        }
      };
  }
}

export function mapStrategyConfigToApiPayload(model: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(model).forEach(([key, value]) => {
    const apiKey = key
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
    payload[apiKey] = value;
  });
  return payload;
}

export function mapApiConfigToStrategyConfig(
  rawConfig: Record<string, unknown> | undefined,
  definition: StrategyConfigDefinition
): Record<string, unknown> {
  const mapped = { ...definition.initialValue };
  Object.entries(rawConfig ?? {}).forEach(([key, value]) => {
    const uiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    mapped[uiKey] = value;
  });
  return mapped;
}
