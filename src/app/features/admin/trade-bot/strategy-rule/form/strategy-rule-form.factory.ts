import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { StrategyRuleStatus } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { FieldConfig, FormConfig, SelectOption } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

export interface StrategyRuleFormValue {
  code: string;
  name: string;
  strategyId: string;
  status: StrategyRuleStatus;
  description: string;
  configJson: Record<string, unknown>;
}

export interface StrategyRuleCodeDefinition {
  code: string;
  label: string;
  description: string;
  configFields: FieldConfig[];
  initialValue: Record<string, unknown>;
}

const buildNumberValidation = (min = 0) => [Rules.required('tradeBot.strategyRule.validation.fieldRequired'), Rules.min(min, `tradeBot.strategyRule.validation.min.${min}`)];

const numberField = (
  name: string,
  label: string,
  width: '1/2' | '1/3' = '1/3',
  validation = buildNumberValidation()
): FieldConfig => ({
  type: 'number',
  name: `configJson.${name}`,
  label,
  width,
  validation
});

const RULE_DEFINITIONS: StrategyRuleCodeDefinition[] = [
  {
    code: 'RSI',
    label: 'RSI',
    description: 'tradeBot.strategyRule.definition.rsi.description',
    configFields: [
      numberField('rsiPeriod', 'tradeBot.strategy.field.rsiPeriod', '1/3', buildNumberValidation(2)),
      numberField('rsiOverbought', 'tradeBot.strategy.field.rsiOverbought'),
      numberField('rsiOversold', 'tradeBot.strategy.field.rsiOversold')
    ],
    initialValue: { rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30 }
  },
  {
    code: 'MACD',
    label: 'MACD',
    description: 'tradeBot.strategyRule.definition.macd.description',
    configFields: [
      numberField('macdFastPeriod', 'tradeBot.strategyRule.field.macdFastPeriod', '1/3', buildNumberValidation(1)),
      numberField('macdSlowPeriod', 'tradeBot.strategyRule.field.macdSlowPeriod', '1/3', buildNumberValidation(2)),
      numberField('macdSignalPeriod', 'tradeBot.strategyRule.field.macdSignalPeriod', '1/3', buildNumberValidation(1))
    ],
    initialValue: { macdFastPeriod: 12, macdSlowPeriod: 26, macdSignalPeriod: 9 }
  },
  {
    code: 'EMA',
    label: 'EMA',
    description: 'tradeBot.strategyRule.definition.ema.description',
    configFields: [numberField('emaPeriod', 'tradeBot.strategyRule.field.emaPeriod', '1/3', buildNumberValidation(2))],
    initialValue: { emaPeriod: 20 }
  },
  {
    code: 'SMA',
    label: 'SMA',
    description: 'tradeBot.strategyRule.definition.sma.description',
    configFields: [numberField('smaPeriod', 'tradeBot.strategyRule.field.smaPeriod', '1/3', buildNumberValidation(2))],
    initialValue: { smaPeriod: 20 }
  },
  {
    code: 'DOWN_TREND',
    label: 'tradeBot.strategyRule.definition.downTrend.label',
    description: 'tradeBot.strategyRule.definition.downTrend.description',
    configFields: [numberField('trendPeriod', 'tradeBot.strategyRule.field.trendPeriod', '1/3', buildNumberValidation(2))],
    initialValue: { trendPeriod: 20 }
  },
  {
    code: 'UP_TREND',
    label: 'tradeBot.strategyRule.definition.upTrend.label',
    description: 'tradeBot.strategyRule.definition.upTrend.description',
    configFields: [numberField('trendPeriod', 'tradeBot.strategyRule.field.trendPeriod', '1/3', buildNumberValidation(2))],
    initialValue: { trendPeriod: 20 }
  },
  {
    code: 'PIVOT_POINT',
    label: 'tradeBot.strategyRule.definition.pivotPoint.label',
    description: 'tradeBot.strategyRule.definition.pivotPoint.description',
    configFields: [
      numberField('pivotLeft', 'tradeBot.strategy.field.pivotLeft', '1/3', buildNumberValidation(1)),
      numberField('pivotRight', 'tradeBot.strategy.field.pivotRight', '1/3', buildNumberValidation(1)),
      numberField('allowEqualBar', 'tradeBot.strategyRule.field.allowEqualBar', '1/3', buildNumberValidation(0))
    ],
    initialValue: { pivotLeft: 2, pivotRight: 2, allowEqualBar: 0 }
  },
  {
    code: 'DEMARK_PIVOT_POINT',
    label: 'tradeBot.strategyRule.definition.demarkPivotPoint.label',
    description: 'tradeBot.strategyRule.definition.demarkPivotPoint.description',
    configFields: [
      numberField('pivotLeft', 'tradeBot.strategy.field.pivotLeft', '1/3', buildNumberValidation(1)),
      numberField('pivotRight', 'tradeBot.strategy.field.pivotRight', '1/3', buildNumberValidation(1)),
      numberField('allowEqualBar', 'tradeBot.strategyRule.field.allowEqualBar', '1/3', buildNumberValidation(0))
    ],
    initialValue: { pivotLeft: 2, pivotRight: 2, allowEqualBar: 0 }
  },
  {
    code: 'DEMARK_REVERSAL',
    label: 'tradeBot.strategyRule.definition.demarkReversal.label',
    description: 'tradeBot.strategyRule.definition.demarkReversal.description',
    configFields: [
      numberField('pivotLeft', 'tradeBot.strategy.field.pivotLeft', '1/3', buildNumberValidation(1)),
      numberField('pivotRight', 'tradeBot.strategy.field.pivotRight', '1/3', buildNumberValidation(1))
    ],
    initialValue: { pivotLeft: 2, pivotRight: 2 }
  },
  {
    code: 'FIBONACCI_REVERSAL',
    label: 'tradeBot.strategyRule.definition.fibonacciReversal.label',
    description: 'tradeBot.strategyRule.definition.fibonacciReversal.description',
    configFields: [
      numberField('pivotLeft', 'tradeBot.strategy.field.pivotLeft', '1/3', buildNumberValidation(1)),
      numberField('pivotRight', 'tradeBot.strategy.field.pivotRight', '1/3', buildNumberValidation(1))
    ],
    initialValue: { pivotLeft: 2, pivotRight: 2 }
  },
  {
    code: 'STANDARD_REVERSAL',
    label: 'tradeBot.strategyRule.definition.standardReversal.label',
    description: 'tradeBot.strategyRule.definition.standardReversal.description',
    configFields: [
      numberField('pivotLeft', 'tradeBot.strategy.field.pivotLeft', '1/3', buildNumberValidation(1)),
      numberField('pivotRight', 'tradeBot.strategy.field.pivotRight', '1/3', buildNumberValidation(1))
    ],
    initialValue: { pivotLeft: 2, pivotRight: 2 }
  },
  {
    code: 'BEARISH_ENGULFING',
    label: 'tradeBot.strategyRule.definition.bearishEngulfing.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'BULLISH_ENGULFING',
    label: 'tradeBot.strategyRule.definition.bullishEngulfing.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'BEARISH_HARAMIL',
    label: 'tradeBot.strategyRule.definition.bearishHarami.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'BULLISH_HARAMIL',
    label: 'tradeBot.strategyRule.definition.bullishHarami.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'DOJI',
    label: 'tradeBot.strategyRule.definition.doji.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'HAMMER',
    label: 'tradeBot.strategyRule.definition.hammer.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'INVERTED_HAMMER',
    label: 'tradeBot.strategyRule.definition.invertedHammer.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'HANGING_MAN',
    label: 'tradeBot.strategyRule.definition.hangingMan.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'SHOOTING_STAR',
    label: 'tradeBot.strategyRule.definition.shootingStar.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'THREE_BLACK_CROW',
    label: 'tradeBot.strategyRule.definition.threeBlackCrow.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  },
  {
    code: 'THREE_WHITE_SOLIDER',
    label: 'tradeBot.strategyRule.definition.threeWhiteSolider.label',
    description: 'tradeBot.strategyRule.definition.noExtraParams',
    configFields: [],
    initialValue: {}
  }
];

const RULE_DEFINITION_MAP = new Map(RULE_DEFINITIONS.map((item) => [item.code, item]));

export const STRATEGY_RULE_CODE_OPTIONS: SelectOption[] = RULE_DEFINITIONS.map((item) => ({ label: item.label, value: item.code }));

export function resolveStrategyRuleDefinition(ruleCode: string | null | undefined): StrategyRuleCodeDefinition {
  const normalizedCode = normalizeRuleCode(ruleCode);
  return (
    RULE_DEFINITION_MAP.get(normalizedCode) ?? {
      code: normalizedCode || 'RSI',
      label: normalizedCode || 'RSI',
      description: 'tradeBot.strategyRule.definition.fallbackDescription',
      configFields: [],
      initialValue: {}
    }
  );
}

export function buildStrategyRuleFormConfig(ruleCode: string | null | undefined): FormConfig {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  const codeOptions = RULE_DEFINITION_MAP.has(definition.code)
    ? STRATEGY_RULE_CODE_OPTIONS
    : [{ label: definition.label, value: definition.code }, ...STRATEGY_RULE_CODE_OPTIONS];

  return {
    fields: [
      {
        type: 'select',
        name: 'code',
        label: 'tradeBot.strategyRule.field.code',
        width: '1/2',
        options: codeOptions,
        validation: [Rules.required('tradeBot.strategyRule.validation.codeRequired')]
      },
      {
        type: 'text',
        name: 'name',
        label: 'tradeBot.strategyRule.field.name',
        width: '1/2',
        validation: [Rules.required('tradeBot.strategyRule.validation.nameRequired')]
      },
      {
        type: 'select',
        name: 'strategyId',
        label: 'tradeBot.strategy.field.strategyName',
        width: '1/2',
        optionsExpression: 'context.extra?.strategyOptions || []',
        validation: [Rules.required('tradeBot.strategyRule.validation.strategyRequired')]
      },
      {
        type: 'select',
        name: 'status',
        label: 'tradeBot.strategy.field.status',
        width: '1/2',
        options: [...SYSTEM_STATUS_OPTIONS],
        validation: [Rules.required('tradeBot.strategyRule.validation.statusRequired')]
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'tradeBot.strategy.field.description',
        width: 'full'
      },
      ...definition.configFields
    ]
  };
}

export function buildStrategyRuleInitialValue(
  ruleCode: string | null | undefined,
  overrides: Partial<StrategyRuleFormValue> = {}
): StrategyRuleFormValue {
  const definition = resolveStrategyRuleDefinition(ruleCode);

  return {
    code: definition.code,
    name: '',
    strategyId: '',
    status: 'ACTIVE',
    description: '',
    configJson: { ...definition.initialValue },
    ...overrides
  };
}

export function mapApiConfigToRuleConfig(rawConfig: Record<string, unknown> | undefined, ruleCode: string | null | undefined): Record<string, unknown> {
  const definition = resolveStrategyRuleDefinition(ruleCode);
  const allowedKeys = new Set(Object.keys(definition.initialValue));
  const mapped = { ...definition.initialValue };

  if (allowedKeys.size === 0 && !RULE_DEFINITION_MAP.has(definition.code)) {
    return { ...(rawConfig ?? {}) };
  }

  Object.entries(rawConfig ?? {}).forEach(([key, value]) => {
    const uiKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    if (allowedKeys.has(uiKey)) {
      mapped[uiKey] = value;
    }
  });

  return mapped;
}

export function mapRuleConfigToApiPayload(model: Record<string, unknown> | undefined): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(model ?? {}).forEach(([key, value]) => {
    const apiKey = key
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
    payload[apiKey] = value;
  });
  return payload;
}

function normalizeRuleCode(ruleCode: string | null | undefined): string {
  return String(ruleCode ?? '')
    .trim()
    .toUpperCase();
}
