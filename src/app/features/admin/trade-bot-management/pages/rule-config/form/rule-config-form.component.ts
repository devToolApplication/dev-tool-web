import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  ExecutorVersionResponse,
  IndicatorConfigResponse,
  RuleConfigDto,
  RuleConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { ConfirmDialogService } from '../../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import {
  FieldConfig,
  FormConfig,
  FormContext,
  FormValidationError,
  FormValidationHelpers,
  SelectOption,
  TreeFormNode,
  TreePickerOption
} from '../../../../../../shared/ui/form-input/models/form-config.model';
import {
  asArray,
  asRecord,
  cloneFormConfig,
  formTemplateSignature,
  hasFormTemplateFields,
  stringValue
} from '../../../config-template-form.utils';
import { parseJson, stringifyJson } from '../../../trade-bot-form-utils';
import { STATUS_OPTIONS, TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';
import { deriveChildRulesFromExpression } from '../../../shared-trading/rule-expression-builder/rule-expression-dependencies';
import { cloneRuleLogicValue } from '../../../shared-trading/rule-expression-builder/rule-expression-factory';
import { ruleExpressionFromConfigAndChildRules } from '../../../shared-trading/rule-expression-builder/rule-expression-legacy';
import {
  RuleExpressionValidationResult,
  RuleLogicFormValue
} from '../../../shared-trading/rule-expression-builder/rule-expression.models';
import { validateRuleExpression } from '../../../shared-trading/rule-expression-builder/rule-expression-validator';

@Component({
  selector: 'app-rule-config-form',
  standalone: false,
  templateUrl: './rule-config-form.component.html'
})
export class RuleConfigFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formConfig: FormConfig = { fields: [] };
  formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly ruleExpressionValue = signal<RuleLogicFormValue>({ root: null });
  readonly ruleExpressionValidation = signal<RuleExpressionValidationResult>(
    validateRuleExpression({ root: null })
  );
  readonly ruleExpressionDirty = signal(false);
  readonly currentRuleCode = signal('');
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.rule.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'save', label: 'tradeBot.action.save', icon: 'pi pi-save', submitForm: true, type: 'submit' }
    ]
  };
  formInitialValue: Record<string, unknown> = this.toFormValue();
  id: string | null = null;
  private executors: ExecutorVersionResponse[] = [];
  indicatorConfigs: IndicatorConfigResponse[] = [];
  ruleConfigs: RuleConfigResponse[] = [];
  private currentFormTemplate?: FormConfig;
  private currentTemplateSignature = '';
  private currentExecutor = '';

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.formContext = { ...this.formContext, mode: this.id ? 'edit' : 'create' };
    this.loadInitialData();
  }

  submit(model: Record<string, unknown>): void {
    this.currentRuleCode.set(stringValue(model['code']));
    const expressionValidation = this.validateCurrentRuleExpression();
    if (!expressionValidation.valid) {
      this.toastService.error(this.i18nService.t('tradeBot.ruleExpression.validation.invalidExpression'));
      return;
    }

    let payload: RuleConfigDto;
    try {
      payload = this.toPayload(model);
    } catch (error) {
      const key = error instanceof Error && error.message === 'INVALID_FORM_TEMPLATE'
        ? 'tradeBot.message.invalidFormTemplate'
        : 'tradeBot.message.invalidJson';
      this.toastService.error(this.i18nService.t(key));
      return;
    }
    this.submitting.set(true);
    this.loadingService
      .track(this.service.saveRuleConfig(this.id, payload))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('saveSuccess'));
          this.crudPage?.markFormPristine();
          void this.router.navigate([TRADE_BOT_ROUTES.rules]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  onValueChange(model: Record<string, unknown>): void {
    const executor = stringValue(model['executor']);
    this.currentRuleCode.set(stringValue(model['code']));
    const normalizedModel: Record<string, unknown> = {
      ...model,
      executorVersion: this.resolveVersion(executor, model['executorVersion'])
    };

    const template = this.templateForExecutor(executor) ?? (executor === this.currentExecutor ? this.currentFormTemplate : undefined);
    const signature = formTemplateSignature(template);
    if (executor === this.currentExecutor && signature === this.currentTemplateSignature) {
      return;
    }

    this.applyTemplateState(normalizedModel, template, executor);
  }

  hasUnsavedChanges(): boolean {
    return (this.crudPage?.hasUnsavedChanges() ?? false) || this.ruleExpressionDirty();
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    if (this.crudPage?.hasUnsavedChanges()) {
      return this.crudPage.confirmDiscardChanges();
    }
    if (!this.ruleExpressionDirty()) {
      return true;
    }
    return this.confirmDialogService.confirm({
      title: 'confirm',
      message: 'shared.form.confirmLeave',
      confirmText: 'yes',
      cancelText: 'cancel',
      variant: 'warning'
    });
  }

  onRuleExpressionValueChange(value: RuleLogicFormValue): void {
    this.ruleExpressionValue.set(cloneRuleLogicValue(value));
    this.ruleExpressionDirty.set(true);
    this.validateCurrentRuleExpression();
  }

  onRuleExpressionValidationChange(result: RuleExpressionValidationResult): void {
    this.ruleExpressionValidation.set(result);
  }

  private loadInitialData(): void {
    this.submitting.set(true);
    const detail$ = this.id ? this.service.getRuleConfig(this.id) : of(null);
    this.loadingService
      .track(
        forkJoin({
          executors: this.service.getRuleExecutors().pipe(catchError(() => of([] as ExecutorVersionResponse[]))),
          indicatorConfigs: this.service.getIndicatorConfigs().pipe(catchError(() => of([] as IndicatorConfigResponse[]))),
          ruleConfigs: this.service.getRuleConfigs().pipe(catchError(() => of([] as RuleConfigResponse[]))),
          detail: detail$
        })
      )
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ executors, indicatorConfigs, ruleConfigs, detail }) => {
          this.executors = executors;
          this.indicatorConfigs = indicatorConfigs;
          this.ruleConfigs = ruleConfigs;
          if (detail) {
            this.applyExistingConfig(detail);
            return;
          }
          this.initializeCreateForm();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private toPayload(model: Record<string, unknown>): RuleConfigDto {
    const template = this.currentFormTemplate;
    const basePayload = {
      code: String(model['code'] ?? ''),
      executor: String(model['executor'] ?? ''),
      executorVersion: String(model['executorVersion'] ?? 'LATEST'),
      status: String(model['status'] ?? 'ACTIVE')
    };

    const childRules = deriveChildRulesFromExpression(this.ruleExpressionValue());

    if (!template) {
      const config = {
        ...parseJson(model['configText'], {}),
        ruleExpression: cloneRuleLogicValue(this.ruleExpressionValue())
      };
      return {
        ...basePayload,
        indicators: this.indicatorsFromModel(model),
        config,
        childRules,
        overlay: asRecord(model['overlay'])
      };
    }

    const config = {
      ...asRecord(model['config']),
      ruleExpression: cloneRuleLogicValue(this.ruleExpressionValue())
    };

    return {
      ...basePayload,
      indicators: this.indicatorsFromModel(model),
      config,
      childRules,
      overlay: asRecord(model['overlay']),
      formTemplate: template
    };
  }

  private toFormValue(value?: RuleConfigResponse): Record<string, unknown> {
    return {
      code: value?.code ?? '',
      executor: value?.executor ?? '',
      executorVersion: value?.executorVersion ?? 'LATEST',
      status: value?.status ?? 'ACTIVE',
      indicators: value?.indicators ?? [],
      config: value?.config ?? {},
      childRules: this.ruleConfigsToTree(value?.childRules),
      ruleExpression: ruleExpressionFromConfigAndChildRules(value?.config, value?.childRules),
      overlay: value?.overlay ?? {},
      configText: stringifyJson(value?.config, {})
    };
  }

  private initializeCreateForm(): void {
    const executor = this.executors[0]?.executor ?? '';
    const executorVersion = this.executors[0]?.latestVersion ?? 'LATEST';
    const initialValue = { ...this.toFormValue(), executor, executorVersion };
    this.applyTemplateState(initialValue, this.templateForExecutor(executor), executor);
  }

  private applyExistingConfig(value: RuleConfigResponse): void {
    const executorVersion = this.resolveVersion(value.executor, value.executorVersion);
    const initialValue = { ...this.toFormValue(value), executorVersion };
    const template = hasFormTemplateFields(value.formTemplate)
      ? cloneFormConfig(value.formTemplate)
      : this.templateForExecutor(value.executor);
    this.applyTemplateState(initialValue, template, value.executor);
  }

  private applyTemplateState(model: Record<string, unknown>, template?: FormConfig, currentExecutor = ''): void {
    this.currentFormTemplate = cloneFormConfig(template);
    this.currentTemplateSignature = formTemplateSignature(template);
    this.currentExecutor = currentExecutor;
    this.currentRuleCode.set(stringValue(model['code']));
    this.ruleExpressionValue.set(ruleExpressionFromModel(model, this.ruleExpressionValue()));
    if ('ruleExpression' in model) {
      this.ruleExpressionDirty.set(false);
    }
    this.validateCurrentRuleExpression();
    this.formInitialValue = this.withLegacyTexts(model);
    this.formConfig = this.buildFormConfig(this.currentFormTemplate, currentExecutor);
    this.updateTemplateFallbackInfo(currentExecutor, this.currentFormTemplate);
  }

  private withLegacyTexts(value: Record<string, unknown>): Record<string, unknown> {
    return {
      ...value,
      configText: value['configText'] ?? stringifyJson(value['config'], {}),
      childRules: this.normalizeRuleTreeValue(value['childRules']),
      overlay: value['overlay'] ?? {}
    };
  }

  private buildFormConfig(template?: FormConfig, currentExecutor = ''): FormConfig {
    const templateFields = hasFormTemplateFields(template)
      ? this.templateFieldsWithCommonRuleFields(template.fields)
      : this.legacyFields();
    return {
      layout: {
        sectionNavigation: 'none',
        showStatusPanel: false
      },
      sections: [
        { id: 'basicInfo', title: 'tradeBot.ruleExpression.basicInfo', icon: 'pi pi-info-circle', order: 0 },
        { id: 'configuration', title: 'shared.form.section.configuration', icon: 'pi pi-sliders-h', order: 1 }
      ],
      fields: [
        ...this.staticFieldGroups(currentExecutor),
        ...this.withDefaultSection(templateFields, 'configuration')
      ],
      validators: {
        ruleChildRules: (value, context) => this.validateRuleChildRules(value, context.formValue, context.helpers)
      }
    };
  }

  private updateTemplateFallbackInfo(executor: string, template?: FormConfig): void {
    this.pageConfig.infoSection = executor && !hasFormTemplateFields(template)
      ? {
          title: 'tradeBot.message.missingFormTemplateTitle',
          description: 'tradeBot.message.missingRuleFormTemplateDescription'
        }
      : null;
  }

  private staticFieldGroups(currentExecutor: string): FieldConfig[] {
    const useExecutorSelect = this.shouldUseExecutorSelect(currentExecutor);
    const versionOptions = this.versionOptions(currentExecutor);
    return [
      {
        name: 'basicInfo',
        type: 'group',
        label: 'tradeBot.ruleExpression.basicInfo',
        sectionId: 'basicInfo',
        width: 'full',
        flat: true,
        children: [
          { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/2', validation: [this.requiredRule()] },
          { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/2' },
          !useExecutorSelect
            ? { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/2', validation: [this.requiredRule()] }
            : {
                name: 'executor',
                type: 'select',
                label: 'tradeBot.field.executor',
                width: '1/2',
                options: this.executors.map((item) => ({ label: item.executor, value: item.executor })),
                validation: [this.requiredRule()]
              },
          !useExecutorSelect || !versionOptions.length
            ? { name: 'executorVersion', type: 'text', label: 'tradeBot.field.executorVersion', width: '1/2' }
            : {
                name: 'executorVersion',
                type: 'select',
                label: 'tradeBot.field.executorVersion',
                width: '1/2',
                options: versionOptions
              }
        ]
      }
    ];
  }

  private withDefaultSection(fields: FieldConfig[], sectionId: string): FieldConfig[] {
    return fields.map((field) => ({
      ...field,
      sectionId: field.sectionId ?? sectionId
    }));
  }

  private legacyFields(): FieldConfig[] {
    return [
      this.indicatorsField(),
      this.overlayRecordField(),
      this.advancedJsonGroup([
        this.jsonTextField('configText', 'tradeBot.field.configJson', 8, 16)
      ])
    ];
  }

  private normalizeTemplateFields(fields: FieldConfig[]): FieldConfig[] {
    return fields.map((field) => this.normalizeTemplateField(field));
  }

  private templateFieldsWithCommonRuleFields(fields: FieldConfig[]): FieldConfig[] {
    const normalizedFields = this.removeFieldByName(this.normalizeTemplateFields(fields), 'childRules');
    const commonFields: FieldConfig[] = [];

    if (!this.hasField(normalizedFields, 'indicators')) {
      commonFields.push(this.indicatorsField());
    }
    if (!this.hasField(normalizedFields, 'overlay')) {
      commonFields.push(this.overlayRecordField());
    }

    return [...normalizedFields, ...commonFields];
  }

  private hasField(fields: FieldConfig[], name: string): boolean {
    return fields.some((field) => {
      if (field.name === name) {
        return true;
      }
      if (field.type === 'group') {
        return this.hasField(field.children, name);
      }
      if (field.type === 'array') {
        return this.hasField(field.itemConfig, name);
      }
      if (field.type === 'tree') {
        return this.hasField(field.children ?? [], name);
      }
      return false;
    });
  }

  private removeFieldByName(fields: FieldConfig[], name: string): FieldConfig[] {
    const result: FieldConfig[] = [];

    fields.forEach((field) => {
      if (field.name === name) {
        return;
      }
      if (field.type === 'group') {
        result.push({ ...field, children: this.removeFieldByName(field.children, name) });
        return;
      }
      if (field.type === 'array') {
        result.push({ ...field, itemConfig: this.removeFieldByName(field.itemConfig, name) });
        return;
      }
      if (field.type === 'tree') {
        result.push({ ...field, children: field.children ? this.removeFieldByName(field.children, name) : field.children });
        return;
      }
      result.push(field);
    });

    return result;
  }

  private normalizeTemplateField(field: FieldConfig): FieldConfig {
    if (field.name === 'indicators') {
      return { ...this.indicatorsField(), label: field.label ?? 'tradeBot.template.indicators', validation: field.validation };
    }

    if (field.name === 'childRules') {
      const childRulesField = this.childRulesTreeField();
      return {
        ...childRulesField,
        label: field.label ?? 'tradeBot.template.childRules',
        validation: [...(childRulesField.validation ?? []), ...(field.validation ?? [])]
      };
    }

    if (field.name === 'overlay' && field.type !== 'record') {
      return this.overlayRecordField(field.label);
    }

    if (field.type === 'group') {
      return {
        ...field,
        children: field.children.map((child) => this.normalizeTemplateField(child))
      };
    }

    if (field.type === 'array') {
      return {
        ...field,
        itemConfig: field.itemConfig.map((child) => this.normalizeTemplateField(child))
      };
    }

    if (field.type === 'tree') {
      const childRulesTreeField = this.childRulesTreeField();
      return {
        ...field,
        validation: [...(childRulesTreeField.validation ?? []), ...(field.validation ?? [])],
        treeConfig: {
          ...(childRulesTreeField.type === 'tree' ? childRulesTreeField.treeConfig : {}),
          ...(field.treeConfig ?? {})
        },
        pickerOptions: field.pickerOptions?.length ? field.pickerOptions : this.rulePickerOptions()
      };
    }

    return field;
  }

  private indicatorsField(): FieldConfig {
    return {
      name: 'indicators',
      type: 'input-multi',
      label: 'tradeBot.template.indicators',
      placeholder: 'tradeBot.template.indicatorsPlaceholder',
      options: this.indicatorOptions(),
      width: 'full'
    };
  }

  private childRulesTreeField(): FieldConfig {
    return {
      name: 'childRules',
      type: 'tree',
      label: 'tradeBot.template.childRules',
      width: 'full',
      pickerOptions: this.rulePickerOptions(),
      treeConfig: {
        mode: 'builder',
        allowAddNode: true,
        allowRemoveNode: true,
        allowReplaceNode: true,
        allowMoveNode: true,
        replaceBehavior: 'keep-children',
        picker: {
          enabled: true,
          mode: 'drawer',
          searchable: true
        },
        advancedJson: {
          enabled: true,
          collapsedByDefault: true
        }
      },
      validation: [
        {
          type: 'expression',
          expression: 'helpers.countTreeNodes(value) > 20',
          message: 'tradeBot.validation.maxChildRules'
        },
        {
          type: 'expression',
          expression: 'helpers.hasDuplicate(value, "ruleCode")',
          message: 'tradeBot.validation.duplicateChildRules'
        },
        {
          type: 'custom',
          validator: 'ruleChildRules',
          message: 'tradeBot.validation.invalidChildRules'
        }
      ]
    };
  }

  private overlayRecordField(label = 'tradeBot.template.overlay'): FieldConfig {
    return {
      name: 'overlay',
      type: 'record',
      label,
      keyLabel: 'tradeBot.template.overlayKey',
      valueLabel: 'tradeBot.template.overlayValue',
      addButtonLabel: 'addRow',
      width: 'full'
    };
  }

  private advancedJsonGroup(children: FieldConfig[]): FieldConfig {
    return {
      name: 'advancedJson',
      type: 'group',
      label: 'shared.form.advancedJson',
      width: 'full',
      flat: true,
      collapsible: true,
      collapsed: true,
      density: 'compact',
      children
    };
  }

  private jsonTextField(name: string, label: string, rows: number, maxRows: number): FieldConfig {
    return {
      name,
      type: 'textarea',
      label,
      contentType: 'json',
      jsonValidationMessage: 'tradeBot.message.invalidJson',
      rows,
      maxRows,
      showZoomButton: true,
      width: 'full'
    };
  }

  private indicatorsFromModel(model: Record<string, unknown>): string[] {
    return asArray<string>(model['indicators'])
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  private indicatorOptions(): SelectOption[] {
    return this.indicatorConfigs
      .map((item) => ({
        label: `${item.code} - ${item.executor}/${item.executorVersion}${item.status ? ` [${item.status}]` : ''}`,
        value: item.code
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private rulePickerOptions(): TreePickerOption[] {
    return this.ruleConfigs
      .filter((item) => item.id !== this.id)
      .map((item) => ({
        id: `rule-${item.code}`,
        label: item.code,
        value: { ruleCode: item.code, config: {} },
        subtitle: `${item.executor}/${item.executorVersion}`,
        badges: item.status
          ? [{ label: item.status, variant: item.status === 'ACTIVE' ? 'success' as const : 'muted' as const }]
          : [],
        data: {
          sourceId: item.id,
          ruleCode: item.code,
          executor: item.executor,
          status: item.status
        }
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private normalizeRuleTreeValue(value: unknown): TreeFormNode[] {
    const items = asArray<Record<string, unknown>>(value);
    if (!items.length) {
      return [];
    }

    const alreadyTreeNodes = items.every((item) => typeof item['id'] === 'string' && typeof item['label'] === 'string');
    return alreadyTreeNodes ? (items as unknown as TreeFormNode[]) : this.ruleConfigsToTree(items);
  }

  private ruleConfigsToTree(value?: Array<Record<string, unknown>>, parentPath = 'rule'): TreeFormNode[] {
    return asArray<Record<string, unknown>>(value).map((item, index) => {
      const ruleCode = stringValue(item['ruleCode'] ?? item['code'], `rule_${index + 1}`);
      const slotCode = stringValue(item['slotCode']);
      const children = asArray<Record<string, unknown>>(item['childRules'] ?? item['children']);
      const referencedRule = this.ruleConfigs.find((rule) => rule.code === ruleCode);
      const nodeValue = { ...item };
      delete nodeValue['childRules'];
      delete nodeValue['children'];

      return {
        id: this.ruleNodeId(parentPath, ruleCode, index),
        label: ruleCode,
        value: nodeValue,
        subtitle: slotCode || undefined,
        data: {
          sourceId: referencedRule?.id,
          ruleCode,
          slotCode: slotCode || undefined,
          executor: referencedRule?.executor,
          status: referencedRule?.status
        },
        children: this.ruleConfigsToTree(children, `${parentPath}-${index}`)
      };
    });
  }

  private ruleTreeToPayload(nodes: TreeFormNode[]): Array<Record<string, unknown>> {
    return nodes.map((node) => {
      const base = { ...asRecord(node.value) };
      const data = asRecord(node.data);
      const ruleCode = stringValue(base['ruleCode'] ?? data['ruleCode'] ?? node.label);
      const slotCode = stringValue(base['slotCode'] ?? data['slotCode']);
      const children = this.ruleTreeToPayload(node.children ?? []);

      const result: Record<string, unknown> = {
        ...base,
        ruleCode
      };

      if (slotCode) {
        result['slotCode'] = slotCode;
      }
      if (children.length) {
        result['childRules'] = children;
      }

      return result;
    });
  }

  private validateRuleChildRules(
    value: unknown,
    formValue: Record<string, unknown>,
    helpers: FormValidationHelpers
  ): true | FormValidationError[] {
    const currentCode = stringValue(formValue['code']);
    const currentId = stringValue(this.id);
    const errors: FormValidationError[] = [];

    helpers.flattenTree(value).forEach((node) => {
      const nodeValue = asRecord(node.value);
      const data = asRecord(node.data);
      const ruleCode = stringValue(nodeValue['ruleCode'] ?? data['ruleCode'] ?? node.label);
      const sourceId = stringValue(data['sourceId'] ?? data['sourceOptionId']);
      const status = stringValue(data['status']);

      if (currentCode && ruleCode === currentCode) {
        errors.push({ message: 'tradeBot.validation.selfChildRule', nodeId: node.id });
      }

      if (currentId && sourceId === currentId) {
        errors.push({ message: 'tradeBot.validation.selfChildRule', nodeId: node.id });
      }

      if (node.disabled || status === 'INACTIVE' || status === 'DISABLED') {
        errors.push({ message: 'tradeBot.validation.inactiveChildRule', nodeId: node.id, severity: 'warning' });
      }

      const circularPath = currentCode && ruleCode ? this.circularDependencyPath(currentCode, ruleCode) : null;
      if (circularPath) {
        errors.push({
          message: `Circular child rule dependency: ${circularPath.join(' -> ')}`,
          nodeId: node.id
        });
      }
    });

    return errors.length ? errors : true;
  }

  private circularDependencyPath(currentCode: string, candidateCode: string): string[] | null {
    if (!currentCode || !candidateCode || currentCode === candidateCode) {
      return null;
    }

    const childPath = this.findRuleDependencyPath(candidateCode, currentCode, new Set([currentCode]));
    return childPath ? [currentCode, ...childPath] : null;
  }

  private findRuleDependencyPath(fromCode: string, targetCode: string, visited: Set<string>): string[] | null {
    if (fromCode === targetCode) {
      return [fromCode];
    }
    if (visited.has(fromCode)) {
      return null;
    }

    visited.add(fromCode);
    const rule = this.ruleConfigs.find((item) => item.code === fromCode);
    if (!rule) {
      return null;
    }

    for (const childPath of this.childRulePaths(rule.childRules)) {
      const childCode = childPath[0];
      if (!childCode) {
        continue;
      }

      const targetIndex = childPath.indexOf(targetCode);
      if (targetIndex >= 0) {
        return [fromCode, ...childPath.slice(0, targetIndex + 1)];
      }

      if (childCode === targetCode) {
        return [fromCode, targetCode];
      }

      const path = this.findRuleDependencyPath(childCode, targetCode, new Set(visited));
      if (path) {
        return [fromCode, ...path];
      }
    }

    return null;
  }

  private childRulePaths(childRules: Array<Record<string, unknown>>): string[][] {
    return asArray<Record<string, unknown>>(childRules).flatMap((child) => {
      const code = stringValue(child['ruleCode'] ?? child['code']);
      const nested = asArray<Record<string, unknown>>(child['childRules'] ?? child['children']);
      const nestedPaths = this.childRulePaths(nested);

      if (!code) {
        return nestedPaths;
      }

      return [
        [code],
        ...nestedPaths.map((path) => [code, ...path])
      ];
    });
  }

  private ruleNodeId(parentPath: string, ruleCode: string, index: number): string {
    return `${parentPath}-${index}-${ruleCode}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  private templateForExecutor(executor: string): FormConfig | undefined {
    const template = this.executors.find((item) => item.executor === executor)?.formTemplate;
    return hasFormTemplateFields(template) ? cloneFormConfig(template) : undefined;
  }

  private shouldUseExecutorSelect(executor: string): boolean {
    return this.executors.length > 0 && (!executor || this.executors.some((item) => item.executor === executor));
  }

  private versionOptions(executor: string): Array<{ label: string; value: string }> {
    const versions = this.executors.find((item) => item.executor === executor)?.versions ?? [];
    return versions.map((version) => ({ label: version, value: version }));
  }

  private resolveVersion(executor: string, value: unknown): string {
    const versions = this.executors.find((item) => item.executor === executor);
    const fallback = versions?.latestVersion ?? stringValue(value, 'LATEST');
    const requested = stringValue(value, fallback);
    return versions?.versions?.includes(requested) ? requested : fallback;
  }

  private requiredRule(): { expression: string; message: string } {
    return { expression: "value == null || String(value).trim() === ''", message: 'required' };
  }

  private validateCurrentRuleExpression(): RuleExpressionValidationResult {
    const result = validateRuleExpression(this.ruleExpressionValue(), {
      indicatorConfigs: this.indicatorConfigs,
      ruleConfigs: this.ruleConfigs,
      currentRuleCode: this.currentRuleCode(),
      currentRuleId: this.id
    });
    this.ruleExpressionValidation.set(result);
    return result;
  }
}

function ruleExpressionFromModel(
  model: Record<string, unknown>,
  fallback: RuleLogicFormValue
): RuleLogicFormValue {
  return 'ruleExpression' in model
    ? ruleExpressionFromConfigAndChildRules({ ruleExpression: model['ruleExpression'] }, asArray<Record<string, unknown>>(model['childRules']))
    : cloneRuleLogicValue(fallback);
}
