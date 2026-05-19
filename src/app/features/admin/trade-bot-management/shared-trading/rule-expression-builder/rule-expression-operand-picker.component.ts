import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  RuleExpressionConstantType,
  RuleExpressionOperand,
  RuleExpressionOperandType,
  RuleExpressionOption
} from './rule-expression.models';
import {
  RULE_EXPRESSION_BOOLEAN_OPTIONS,
  RULE_EXPRESSION_CONSTANT_TYPES,
  RULE_EXPRESSION_OPERAND_TYPES,
  RULE_EXPRESSION_PRICE_SERIES
} from './rule-expression-operators';

@Component({
  selector: 'app-rule-expression-operand-picker',
  standalone: false,
  templateUrl: './rule-expression-operand-picker.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionOperandPickerComponent {
  @Input() operand: RuleExpressionOperand | null | undefined;
  @Input() label = 'tradeBot.ruleExpression.field.operand';
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly operandChange = new EventEmitter<RuleExpressionOperand>();

  readonly operandTypeOptions = RULE_EXPRESSION_OPERAND_TYPES;
  readonly constantTypeOptions = RULE_EXPRESSION_CONSTANT_TYPES;
  readonly booleanOptions = RULE_EXPRESSION_BOOLEAN_OPTIONS;
  readonly outputOptions: RuleExpressionOption[] = [
    { label: 'VALUE', value: 'VALUE' },
    { label: 'MAIN', value: 'MAIN' },
    { label: 'SIGNAL', value: 'SIGNAL' },
    { label: 'UPPER', value: 'UPPER' },
    { label: 'LOWER', value: 'LOWER' },
    { label: 'HISTOGRAM', value: 'HISTOGRAM' },
    { label: 'FAST', value: 'FAST' },
    { label: 'SLOW', value: 'SLOW' }
  ];

  get resolvedOperand(): RuleExpressionOperand {
    return this.operand ?? this.defaultOperand('priceSeries');
  }

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  indicatorOptions(): RuleExpressionOption[] {
    return this.indicatorConfigs
      .map((item) => ({
        label: `${item.code} - ${item.executor}/${item.executorVersion}${item.status ? ` [${item.status}]` : ''}`,
        value: item.code,
        disabled: item.status === 'INACTIVE' || item.status === 'DISABLED'
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  ruleOptions(): RuleExpressionOption[] {
    return this.ruleConfigs
      .filter((item) => item.id !== this.currentRuleId)
      .map((item) => ({
        label: `${item.code} - ${item.executor}/${item.executorVersion}${item.status ? ` [${item.status}]` : ''}`,
        value: item.code,
        disabled: item.status === 'INACTIVE' || item.status === 'DISABLED'
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  priceSeriesOptions(): RuleExpressionOption[] {
    return RULE_EXPRESSION_PRICE_SERIES.map((series) => ({ label: series, value: series }));
  }

  updateType(value: unknown): void {
    if (this.readonlyOrDisabled || !this.isOperandType(value)) {
      return;
    }
    this.operandChange.emit(this.defaultOperand(value));
  }

  updateIndicatorCode(value: unknown): void {
    this.patch({ indicatorCode: this.textValue(value) });
  }

  updateOutputName(value: unknown): void {
    this.patch({ outputName: this.textValue(value) });
  }

  updatePriceSeries(value: unknown): void {
    this.patch({ series: this.textValue(value) as RuleExpressionOperand['series'] });
  }

  updateRuleCode(value: unknown): void {
    this.patch({ ruleCode: this.textValue(value) });
  }

  updateConstantType(value: unknown): void {
    if (!this.isConstantType(value)) {
      return;
    }
    const current = this.resolvedOperand;
    const nextValue = value === 'number' ? 0 : value === 'boolean' ? false : '';
    this.operandChange.emit({ ...current, type: 'constant', valueType: value, value: nextValue });
  }

  updateConstantNumber(value: number | null): void {
    this.patch({ valueType: 'number', value: value ?? 0 });
  }

  updateConstantText(value: string | null): void {
    this.patch({ valueType: 'string', value: value ?? '' });
  }

  updateConstantBoolean(value: unknown): void {
    this.patch({ valueType: 'boolean', value: value === true || value === 'true' });
  }

  private patch(partial: Partial<RuleExpressionOperand>): void {
    if (this.readonlyOrDisabled) {
      return;
    }
    this.operandChange.emit({ ...this.resolvedOperand, ...partial });
  }

  private defaultOperand(type: RuleExpressionOperandType): RuleExpressionOperand {
    if (type === 'indicator') {
      return { type, indicatorCode: this.indicatorOptions()[0]?.value ?? '' };
    }
    if (type === 'indicatorOutput') {
      return { type, indicatorCode: this.indicatorOptions()[0]?.value ?? '', outputName: 'VALUE' };
    }
    if (type === 'ruleRef') {
      return { type, ruleCode: this.ruleOptions()[0]?.value ?? '' };
    }
    if (type === 'constant') {
      return { type, valueType: 'number', value: 0 };
    }
    return { type, series: 'CLOSE' };
  }

  private isOperandType(value: unknown): value is RuleExpressionOperandType {
    return ['indicator', 'indicatorOutput', 'priceSeries', 'ruleRef', 'constant'].includes(String(value));
  }

  private isConstantType(value: unknown): value is RuleExpressionConstantType {
    return value === 'number' || value === 'string' || value === 'boolean';
  }

  private textValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}

