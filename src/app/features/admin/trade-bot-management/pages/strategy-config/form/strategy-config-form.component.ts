import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  ExecutorVersionResponse,
  RuleConfigResponse,
  StrategyConfigDto,
  StrategyConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FieldConfig, FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import {
  asRecord,
  cloneFormConfig,
  formTemplateSignature,
  hasFormTemplateFields,
  stringValue
} from '../../../config-template-form.utils';
import { parseJson, stringifyJson } from '../../../trade-bot-form-utils';
import { STATUS_OPTIONS, TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-strategy-config-form',
  standalone: false,
  templateUrl: './strategy-config-form.component.html'
})
export class StrategyConfigFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formConfig: FormConfig = { fields: [] };
  formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.strategy.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'save', label: 'tradeBot.action.save', icon: 'pi pi-save', submitForm: true, type: 'submit' }
    ]
  };
  formInitialValue: Record<string, unknown> = this.toFormValue();
  private id: string | null = null;
  private executors: ExecutorVersionResponse[] = [];
  private rules: RuleConfigResponse[] = [];
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
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.formContext = { ...this.formContext, mode: this.id ? 'edit' : 'create' };
    this.loadInitialData();
  }

  submit(model: Record<string, unknown>): void {
    let payload: StrategyConfigDto;
    try {
      payload = this.toPayload(model);
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.submitting.set(true);
    this.loadingService
      .track(this.service.saveStrategyConfig(this.id, payload))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('saveSuccess'));
          this.crudPage?.markFormPristine();
          void this.router.navigate([TRADE_BOT_ROUTES.strategies]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  onValueChange(model: Record<string, unknown>): void {
    const executor = stringValue(model['type'], 'ENTRY_TP_SL');
    const normalizedModel: Record<string, unknown> = {
      ...model,
      strategyVersion: this.resolveVersion(executor, model['strategyVersion'])
    };

    const template = this.templateForExecutor(executor) ?? (executor === this.currentExecutor ? this.currentFormTemplate : undefined);
    const signature = formTemplateSignature(template);
    if (executor === this.currentExecutor && signature === this.currentTemplateSignature) {
      return;
    }

    this.applyTemplateState(normalizedModel, template, executor);
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private loadInitialData(): void {
    this.submitting.set(true);
    const detail$ = this.id ? this.service.getStrategyConfig(this.id) : of(null);
    this.loadingService
      .track(
        forkJoin({
          executors: this.service.getStrategyExecutors().pipe(catchError(() => of([] as ExecutorVersionResponse[]))),
          rules: this.service.getRuleConfigs({ status: 'ACTIVE' }).pipe(catchError(() => of([] as RuleConfigResponse[]))),
          detail: detail$
        })
      )
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ executors, rules, detail }) => {
          this.executors = executors;
          this.rules = rules;
          if (detail) {
            this.applyExistingConfig(detail);
            return;
          }
          this.initializeCreateForm();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private toPayload(model: Record<string, unknown>): StrategyConfigDto {
    const type = stringValue(model['type'], 'ENTRY_TP_SL');
    const basePayload = {
      code: String(model['code'] ?? ''),
      type,
      strategyVersion: String(model['strategyVersion'] ?? 'LATEST'),
      entryRule: String(model['entryRule'] ?? ''),
      slRule: String(model['slRule'] ?? ''),
      tpRule: String(model['tpRule'] ?? ''),
      status: String(model['status'] ?? 'ACTIVE')
    };

    if (!this.currentFormTemplate) {
      return {
        ...basePayload,
        config: {
          ...parseJson(model['configText'], {}),
          ...this.legacyConfigFromModel(model)
        }
      };
    }

    return {
      ...basePayload,
      config: asRecord(model['config']),
      formTemplate: this.currentFormTemplate
    };
  }

  private toFormValue(value?: StrategyConfigResponse): Record<string, unknown> {
    const config = asRecord(value?.config);
    return {
      code: value?.code ?? '',
      type: value?.type ?? 'ENTRY_TP_SL',
      strategyVersion: value?.strategyVersion ?? 'LATEST',
      entryRule: value?.entryRule ?? '',
      slRule: value?.slRule ?? '',
      tpRule: value?.tpRule ?? '',
      status: value?.status ?? 'ACTIVE',
      config,
      configText: stringifyJson(config, { side: 'BUY' })
    };
  }

  private initializeCreateForm(): void {
    const executor = this.executors[0]?.executor ?? 'ENTRY_TP_SL';
    const strategyVersion = this.executors[0]?.latestVersion ?? 'LATEST';
    const initialValue = { ...this.toFormValue(), type: executor, strategyVersion };
    this.applyTemplateState(initialValue, this.templateForExecutor(executor), executor);
  }

  private applyExistingConfig(value: StrategyConfigResponse): void {
    const executor = stringValue(value.type, 'ENTRY_TP_SL');
    const strategyVersion = this.resolveVersion(executor, value.strategyVersion);
    const initialValue = { ...this.toFormValue(value), strategyVersion };
    const template = hasFormTemplateFields(value.formTemplate)
      ? cloneFormConfig(value.formTemplate)
      : this.templateForExecutor(executor);
    this.applyTemplateState(initialValue, template, executor);
  }

  private applyTemplateState(model: Record<string, unknown>, template?: FormConfig, currentExecutor = ''): void {
    this.currentFormTemplate = cloneFormConfig(template);
    this.currentTemplateSignature = formTemplateSignature(template);
    this.currentExecutor = currentExecutor;
    this.formInitialValue = this.withLegacyTexts(model);
    this.formConfig = this.buildFormConfig(this.currentFormTemplate, currentExecutor);
    this.updateTemplateFallbackInfo(currentExecutor, this.currentFormTemplate);
  }

  private withLegacyTexts(value: Record<string, unknown>): Record<string, unknown> {
    const config = asRecord(value['config']);
    return {
      ...value,
      config,
      configText: value['configText'] ?? stringifyJson(config, { side: 'BUY' })
    };
  }

  private buildFormConfig(template?: FormConfig, currentExecutor = ''): FormConfig {
    const templateFields = hasFormTemplateFields(template)
      ? this.normalizeTemplateFields(template.fields)
      : this.legacyFields();
    return {
      fields: [
        ...this.staticFieldGroups(currentExecutor),
        this.ruleMappingGroup(),
        ...templateFields
      ]
    };
  }

  private updateTemplateFallbackInfo(executor: string, template?: FormConfig): void {
    this.pageConfig.infoSection = executor && !hasFormTemplateFields(template)
      ? {
          title: 'tradeBot.message.missingFormTemplateTitle',
          description: 'tradeBot.message.missingStrategyFormTemplateDescription'
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
        label: 'general',
        width: 'full',
        flat: true,
        children: [
          { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [this.requiredRule()] },
          !useExecutorSelect
            ? { name: 'type', type: 'text', label: 'tradeBot.field.type', width: '1/3', validation: [this.requiredRule()] }
            : {
                name: 'type',
                type: 'select',
                label: 'tradeBot.field.type',
                options: this.executors.map((item) => ({ label: item.executor, value: item.executor })),
                width: '1/3',
                validation: [this.requiredRule()]
              },
          !useExecutorSelect || !versionOptions.length
            ? { name: 'strategyVersion', type: 'text', label: 'tradeBot.field.strategyVersion', width: '1/3' }
            : {
                name: 'strategyVersion',
                type: 'select',
                label: 'tradeBot.field.strategyVersion',
                width: '1/3',
                options: versionOptions
              },
          { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' }
        ]
      }
    ];
  }

  private ruleMappingGroup(): FieldConfig {
    const ruleOptions = this.rules
      .map((rule) => ({ label: `${rule.code} - ${rule.executor}/${rule.executorVersion}`, value: rule.code }))
      .sort((left, right) => left.label.localeCompare(right.label));
    return {
      name: 'ruleMapping',
      type: 'group',
      label: 'tradeBot.template.ruleMapping',
      width: 'full',
      flat: true,
      children: [
        { name: 'entryRule', type: 'auto-complete', label: 'tradeBot.field.entryRule', options: ruleOptions, width: '1/3', validation: [this.requiredRule()] },
        { name: 'slRule', type: 'auto-complete', label: 'tradeBot.field.slRule', options: ruleOptions, width: '1/3', validation: [this.requiredRule()] },
        { name: 'tpRule', type: 'auto-complete', label: 'tradeBot.field.tpRule', options: ruleOptions, width: '1/3', validation: [this.requiredRule()] }
      ]
    };
  }

  private legacyFields(): FieldConfig[] {
    return [
      this.advancedJsonGroup([
        this.jsonTextField('configText', 'tradeBot.field.configJson', 8, 16)
      ])
    ];
  }

  private normalizeTemplateFields(fields: FieldConfig[]): FieldConfig[] {
    return fields.map((field) => this.normalizeTemplateField(field));
  }

  private normalizeTemplateField(field: FieldConfig): FieldConfig {
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
      return {
        ...field,
        children: field.children?.map((child) => this.normalizeTemplateField(child))
      };
    }

    return field;
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

  private legacyConfigFromModel(model: Record<string, unknown>): Record<string, unknown> {
    const hasLegacyFields = [
      'strategySide',
      'allowMultiplePositions',
      'maxOpenPositions',
      'riskProfile',
      'note'
    ].some((field) => Object.prototype.hasOwnProperty.call(model, field));

    if (!hasLegacyFields) {
      return {};
    }

    return {
      side: String(model['strategySide'] ?? 'BUY'),
      allowMultiplePositions: model['allowMultiplePositions'] === true,
      maxOpenPositions: this.numberValue(model['maxOpenPositions'], 1),
      riskProfile: String(model['riskProfile'] ?? 'default'),
      note: String(model['note'] ?? '')
    };
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

  private numberValue(value: unknown, fallback: number): number {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  }

  private requiredRule(): { expression: string; message: string } {
    return { expression: "value == null || String(value).trim() === ''", message: 'required' };
  }
}
