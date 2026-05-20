import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { SharedModule } from '../../../../../shared/shared.module';
import { RuleExpressionBuilderComponent } from './rule-expression-builder.component';
import { RuleConditionRowComponent } from './rule-condition-row.component';
import { RuleExpressionJsonPreviewComponent } from './rule-expression-json-preview.component';
import { RuleExpressionNodeComponent } from './rule-expression-node.component';
import { RuleExpressionOperandPickerComponent } from './rule-expression-operand-picker.component';
import { RuleExpressionPanelComponent } from './rule-expression-panel.component';

const value = {
  root: {
    id: 'story-root',
    type: 'group' as const,
    operator: 'AND' as const,
    children: [
      {
        id: 'story-condition-macd',
        type: 'condition' as const,
        operator: 'CROSSOVER' as const,
        operands: [
          { type: 'indicator' as const, indicatorCode: 'MACD' },
          { type: 'priceSeries' as const, series: 'CLOSEPRICE' as const }
        ],
        params: { lookback: 1, tolerance: 0 }
      },
      {
        id: 'story-condition-bb',
        type: 'condition' as const,
        operator: 'CROSSUNDER' as const,
        operands: [
          { type: 'indicator' as const, indicatorCode: 'BOLLINGER_BAND_LOW' },
          { type: 'priceSeries' as const, series: 'CLOSEPRICE' as const }
        ],
        params: { lookback: 1, tolerance: 0 }
      }
    ]
  }
};

const nestedValue = {
  root: {
    id: 'story-nested-root',
    type: 'group' as const,
    operator: 'OR' as const,
    children: [
      {
        id: 'story-rule-a',
        type: 'ruleRef' as const,
        ruleCode: 'RULE_A'
      },
      {
        id: 'story-nested-and',
        type: 'group' as const,
        operator: 'AND' as const,
        children: [
          {
            id: 'story-rule-c',
            type: 'ruleRef' as const,
            ruleCode: 'RULE_C'
          },
          {
            id: 'story-condition-de',
            type: 'condition' as const,
            operator: 'CROSSOVER' as const,
            operands: [
              { type: 'indicator' as const, indicatorCode: 'D' },
              { type: 'indicator' as const, indicatorCode: 'E' }
            ],
            params: { lookback: 1, tolerance: 0 }
          }
        ]
      }
    ]
  }
};

const meta: Meta<RuleExpressionBuilderComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Rule Expression Builder',
  component: RuleExpressionBuilderComponent,
  decorators: [
    moduleMetadata({
      declarations: [
        RuleConditionRowComponent,
        RuleExpressionJsonPreviewComponent,
        RuleExpressionNodeComponent,
        RuleExpressionOperandPickerComponent,
        RuleExpressionPanelComponent
      ],
      imports: [SharedModule]
    })
  ],
  args: {
    value,
    currentRuleCode: 'ENTRY_RULE',
    currentRuleId: 'rule-entry',
    indicatorConfigs: [
      {
        id: 'indicator-fast',
        code: 'MACD',
        executor: 'MACD',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'indicator-slow',
        code: 'BOLLINGER_BAND_LOW',
        executor: 'BOLLINGER_BAND',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'indicator-d',
        code: 'D',
        executor: 'CUSTOM',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'indicator-e',
        code: 'E',
        executor: 'CUSTOM',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ],
    ruleConfigs: [
      {
        id: 'rule-volume',
        code: 'RULE_A',
        executor: 'VOLUME_RULE',
        executorVersion: 'v1',
        config: {},
        indicators: [],
        childRules: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'rule-c',
        code: 'RULE_C',
        executor: 'CONFIRM_RULE',
        executorVersion: 'v1',
        config: {},
        indicators: [],
        childRules: [],
        overlay: {},
        status: 'ACTIVE'
      }
    ]
  }
};

export default meta;

type Story = StoryObj<RuleExpressionBuilderComponent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: { root: null }
  }
};

export const NestedOrAnd: Story = {
  args: {
    value: nestedValue
  }
};

export const InvalidMissingOperand: Story = {
  args: {
    value: {
      root: {
        id: 'story-invalid',
        type: 'condition',
        operator: 'CROSSOVER',
        operands: [{ type: 'indicator', indicatorCode: 'MACD' }],
        params: { lookback: 1, tolerance: 0 }
      }
    }
  }
};

export const DisabledNode: Story = {
  args: {
    value: {
      root: {
        ...value.root,
        children: [
          value.root.children[0],
          {
            ...value.root.children[1],
            disabled: true
          }
        ]
      }
    }
  }
};

export const Readonly: Story = {
  args: {
    readonly: true
  }
};
