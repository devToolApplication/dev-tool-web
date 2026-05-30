import { Component, ElementRef, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  RuleExpressionConstantType,
  RuleExpressionOperand,
  RuleExpressionOperandValueType,
} from './rule-expression.models';
import {
  RULE_EXPRESSION_BOOLEAN_OPTIONS,
  RULE_EXPRESSION_CONSTANT_TYPES,
} from './rule-expression-operators';
import { printRuleExpressionOperand } from './rule-expression-printer';

interface OperandPickerOption {
  id: string;
  groupLabel: string;
  label: string;
  meta: string;
  value: RuleExpressionOperand;
  valueTypes: RuleExpressionOperandValueType[];
  disabled?: boolean;
}

interface OperandPickerGroup {
  label: string;
  options: OperandPickerOption[];
}

@Component({
  selector: 'app-rule-expression-operand-picker',
  standalone: false,
  templateUrl: './rule-expression-operand-picker.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionOperandPickerComponent {
  @Input() operand: RuleExpressionOperand | null | undefined;
  @Input() label = 'tradeBot.ruleExpression.field.operand';
  @Input() placeholder = 'tradeBot.ruleExpression.selectOperand';
  @Input() allowedValueTypes: RuleExpressionOperandValueType[] = [];
  @Input() indicatorConfigs: IndicatorConfigResponse[] = [];
  @Input() ruleConfigs: RuleConfigResponse[] = [];
  @Input() currentRuleId: string | null = null;
  @Input() readonly = false;
  @Input() disabled = false;

  @Output() readonly operandChange = new EventEmitter<RuleExpressionOperand>();

  private readonly elRef = inject(ElementRef);
  readonly open = signal(false);
  readonly query = signal('');
  readonly menuStyle = signal<Record<string, string>>({});
  readonly constantTypeOptions = RULE_EXPRESSION_CONSTANT_TYPES;
  readonly booleanOptions = RULE_EXPRESSION_BOOLEAN_OPTIONS;

  get readonlyOrDisabled(): boolean {
    return this.readonly || this.disabled;
  }

  get resolvedLabel(): string {
    return this.operand ? printRuleExpressionOperand(this.operand) : this.placeholder;
  }

  get hasValue(): boolean {
    return Boolean(this.operand);
  }

  get constantOperand(): RuleExpressionOperand | null {
    return this.operand?.type === 'constant' ? this.operand : null;
  }

  optionGroups(): OperandPickerGroup[] {
    const keyword = this.query().trim().toLowerCase();
    const grouped = new Map<string, OperandPickerOption[]>();

    this.allOptions()
      .filter((option) => this.optionAllowed(option))
      .filter((option) => this.optionMatches(option, keyword))
      .forEach((option) => {
        const current = grouped.get(option.groupLabel) ?? [];
        current.push(option);
        grouped.set(option.groupLabel, current);
      });

    return Array.from(grouped.entries()).map(([label, options]) => ({ label, options }));
  }

  toggleOpen(): void {
    if (this.readonlyOrDisabled) {
      return;
    }
    const willOpen = !this.open();
    this.open.set(willOpen);
    if (willOpen) {
      const rect = this.elRef.nativeElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = Math.min(28 * 16, window.innerHeight * 0.5);
      const top = spaceBelow > menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
      this.menuStyle.set({
        top: `${Math.max(top, 8)}px`,
        left: `${rect.left}px`,
      });
    }
  }

  close(): void {
    this.open.set(false);
  }

  updateQuery(value: string | null): void {
    this.query.set(value ?? '');
  }

  selectOption(option: OperandPickerOption): void {
    if (this.readonlyOrDisabled || option.disabled) {
      return;
    }
    this.operandChange.emit({ ...option.value });
    this.close();
  }

  updateConstantType(value: unknown): void {
    if (!this.isConstantType(value)) {
      return;
    }
    const nextValue = value === 'number' ? 0 : value === 'boolean' ? false : '';
    this.emitConstant({ valueType: value, value: nextValue });
  }

  updateConstantNumber(value: number | null): void {
    this.emitConstant({ valueType: 'number', value: value ?? 0 });
  }

  updateConstantText(value: string | null): void {
    this.emitConstant({ valueType: 'string', value: value ?? '' });
  }

  updateConstantBoolean(value: unknown): void {
    this.emitConstant({ valueType: 'boolean', value: value === true || value === 'true' });
  }

  valueTypeAllowed(valueType: RuleExpressionOperandValueType): boolean {
    return !this.allowedValueTypes.length || this.allowedValueTypes.includes(valueType);
  }

  private emitConstant(partial: Partial<RuleExpressionOperand>): void {
    if (this.readonlyOrDisabled) {
      return;
    }
    this.operandChange.emit({
      type: 'constant',
      valueType: 'number',
      value: 0,
      ...this.constantOperand,
      ...partial
    });
  }

  private allOptions(): OperandPickerOption[] {
    return [
      ...this.indicatorOptions(),
      ...this.ruleOptions(),
      ...this.constantOptions()
    ];
  }

  private indicatorOptions(): OperandPickerOption[] {
    return this.indicatorConfigs
      .map((item) => ({
        id: `indicator-${item.code}`,
        groupLabel: item.group || 'tradeBot.ruleExpression.operandGroup.indicators',
        label: item.code,
        meta: item.status === 'ACTIVE'
          ? 'tradeBot.ruleExpression.operandMeta.indicatorActive'
          : 'tradeBot.ruleExpression.operandMeta.indicator',
        value: { type: 'indicator' as const, indicatorCode: item.code },
        valueTypes: ['numericSeries'] as RuleExpressionOperandValueType[],
        disabled: item.status === 'INACTIVE' || item.status === 'DISABLED'
      }))
      .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel) || a.label.localeCompare(b.label));
  }

  private ruleOptions(): OperandPickerOption[] {
    return this.ruleConfigs
      .filter((item) => item.id !== this.currentRuleId)
      .map((item) => ({
        id: `rule-${item.code}`,
        groupLabel: item.group || 'tradeBot.ruleExpression.operandGroup.rules',
        label: item.code,
        meta: item.status === 'ACTIVE'
          ? 'tradeBot.ruleExpression.operandMeta.ruleActive'
          : 'tradeBot.ruleExpression.operandMeta.rule',
        value: { type: 'ruleRef' as const, ruleCode: item.code },
        valueTypes: ['ruleValue'] as RuleExpressionOperandValueType[],
        disabled: item.status === 'INACTIVE' || item.status === 'DISABLED'
      }))
      .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel) || a.label.localeCompare(b.label));
  }

  private constantOptions(): OperandPickerOption[] {
    const options: Array<{
      id: string;
      label: string;
      valueType: RuleExpressionConstantType;
      value: string | number | boolean;
      valueTypes: RuleExpressionOperandValueType[];
    }> = [
      {
        id: 'constant-number',
        label: 'tradeBot.ruleExpression.constant.number',
        valueType: 'number',
        value: 0,
        valueTypes: ['number']
      },
      {
        id: 'constant-boolean',
        label: 'tradeBot.ruleExpression.constant.boolean',
        valueType: 'boolean',
        value: false,
        valueTypes: ['boolean']
      },
      {
        id: 'constant-string',
        label: 'tradeBot.ruleExpression.constant.string',
        valueType: 'string',
        value: '',
        valueTypes: ['string']
      }
    ];

    return options.map((item) => ({
      id: item.id,
      groupLabel: 'tradeBot.ruleExpression.operandGroup.constants',
      label: item.label,
      meta: 'tradeBot.ruleExpression.operandMeta.constant',
      value: { type: 'constant', valueType: item.valueType, value: item.value },
      valueTypes: item.valueTypes
    }));
  }

  private optionAllowed(option: OperandPickerOption): boolean {
    if (!this.allowedValueTypes.length) {
      return true;
    }
    return option.valueTypes.some((type) => this.allowedValueTypes.includes(type));
  }

  private optionMatches(option: OperandPickerOption, keyword: string): boolean {
    if (!keyword) {
      return true;
    }
    return `${option.label} ${option.meta}`.toLowerCase().includes(keyword);
  }

  private isConstantType(value: unknown): value is RuleExpressionConstantType {
    return value === 'number' || value === 'string' || value === 'boolean';
  }
}
