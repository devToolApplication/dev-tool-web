import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { SharedModule } from '../../../../../shared/shared.module';
import { RuleExpressionBuilderComponent } from './rule-expression-builder.component';
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
        id: 'story-condition',
        type: 'condition' as const,
        operator: 'GT' as const,
        operands: [
          { type: 'indicatorOutput' as const, indicatorCode: 'EMA_FAST', outputName: 'VALUE' },
          { type: 'indicatorOutput' as const, indicatorCode: 'EMA_SLOW', outputName: 'VALUE' }
        ]
      },
      {
        id: 'story-rule-ref',
        type: 'ruleRef' as const,
        ruleCode: 'VOLUME_CONFIRMATION'
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
        code: 'EMA_FAST',
        executor: 'EMA',
        executorVersion: 'v1',
        config: {},
        children: [],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'indicator-slow',
        code: 'EMA_SLOW',
        executor: 'EMA',
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
        code: 'VOLUME_CONFIRMATION',
        executor: 'VOLUME_RULE',
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

