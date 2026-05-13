import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  ExecutorVersionResponse,
  RuleConfigDto,
  RuleConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FieldConfig, FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import {
  asArray,
  asRecord,
  cloneFormConfig,
  formTemplateSignature,
  formTemplateText,
  hasFormTemplateFields,
  parseFormTemplateText,
  stringValue,
  tryParseFormTemplateText
} from '../../../config-template-form.utils';
import { parseJson, stringifyJson } from '../../../trade-bot-form-utils';
import { STATUS_OPTIONS, TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-rule-config-form',
  standalone: false,
  templateUrl: './rule-config-form.component.html'
})
export class RuleConfigFormComponent implements OnInit {
  formConfig: FormConfig = { fields: [] };
  formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.rule.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'save', label: 'tradeBot.action.save', icon: 'pi pi-save', submitForm: true, type: 'submit' }
    ]
  };
  formInitialValue: Record<string, unknown> = this.toFormValue();
  private id: string | null = null;
  private executors: ExecutorVersionResponse[] = [];
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
          void this.router.navigate([TRADE_BOT_ROUTES.rules]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  onValueChange(model: Record<string, unknown>): void {
    const executor = stringValue(model['executor']);
    const normalizedModel: Record<string, unknown> = {
      ...model,
      executorVersion: this.resolveVersion(executor, model['executorVersion'])
    };
    const parsedTemplate = tryParseFormTemplateText(normalizedModel['formTemplateText']);
    if (parsedTemplate.invalid) {
      return;
    }

    const signature = formTemplateSignature(parsedTemplate.template);
    if (executor === this.currentExecutor && signature === this.currentTemplateSignature) {
      return;
    }

    this.applyTemplateState(normalizedModel, parsedTemplate.template, executor);
  }

  private loadInitialData(): void {
    this.submitting.set(true);
    const detail$ = this.id ? this.service.getRuleConfig(this.id) : of(null);
    this.loadingService
      .track(
        forkJoin({
          executors: this.service.getRuleExecutors().pipe(catchError(() => of([] as ExecutorVersionResponse[]))),
          detail: detail$
        })
      )
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ executors, detail }) => {
          this.executors = executors;
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
    const template = parseFormTemplateText(model['formTemplateText']);
    const basePayload = {
      code: String(model['code'] ?? ''),
      executor: String(model['executor'] ?? ''),
      executorVersion: String(model['executorVersion'] ?? 'LATEST'),
      status: String(model['status'] ?? 'ACTIVE')
    };

    if (!template) {
      return {
        ...basePayload,
        indicators: parseJson(model['indicatorsText'], []),
        config: parseJson(model['configText'], {}),
        childRules: parseJson(model['childRulesText'], []),
        overlay: parseJson(model['overlayText'], {})
      };
    }

    return {
      ...basePayload,
      indicators: asArray<string>(model['indicators']).map((item) => String(item ?? '').trim()).filter(Boolean),
      config: asRecord(model['config']),
      childRules: asArray(model['childRules']),
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
      childRules: value?.childRules ?? [],
      overlay: value?.overlay ?? {},
      formTemplateText: formTemplateText(value?.formTemplate),
      indicatorsText: stringifyJson(value?.indicators, []),
      configText: stringifyJson(value?.config, {}),
      childRulesText: stringifyJson(value?.childRules, []),
      overlayText: stringifyJson(value?.overlay, {})
    };
  }

  private initializeCreateForm(): void {
    const executor = this.executors[0]?.executor ?? '';
    const executorVersion = this.executors[0]?.latestVersion ?? 'LATEST';
    const initialValue = { ...this.toFormValue(), executor, executorVersion };
    this.applyTemplateState(initialValue, undefined, executor);
  }

  private applyExistingConfig(value: RuleConfigResponse): void {
    const executorVersion = this.resolveVersion(value.executor, value.executorVersion);
    const initialValue = { ...this.toFormValue(value), executorVersion };
    const template = hasFormTemplateFields(value.formTemplate) ? cloneFormConfig(value.formTemplate) : undefined;
    this.applyTemplateState(initialValue, template, value.executor);
  }

  private applyTemplateState(model: Record<string, unknown>, template?: FormConfig, currentExecutor = ''): void {
    this.currentFormTemplate = cloneFormConfig(template);
    this.currentTemplateSignature = formTemplateSignature(template);
    this.currentExecutor = currentExecutor;
    this.formInitialValue = this.withLegacyTexts(model);
    this.formConfig = this.buildFormConfig(this.currentFormTemplate, currentExecutor);
  }

  private withLegacyTexts(value: Record<string, unknown>): Record<string, unknown> {
    return {
      ...value,
      indicatorsText: value['indicatorsText'] ?? stringifyJson(value['indicators'], []),
      configText: value['configText'] ?? stringifyJson(value['config'], {}),
      childRulesText: value['childRulesText'] ?? stringifyJson(value['childRules'], []),
      overlayText: value['overlayText'] ?? stringifyJson(value['overlay'], {})
    };
  }

  private buildFormConfig(template?: FormConfig, currentExecutor = ''): FormConfig {
    const templateFields = hasFormTemplateFields(template) ? template.fields : this.legacyFields();
    return {
      fields: [...this.staticFields(currentExecutor), ...templateFields]
    };
  }

  private staticFields(currentExecutor: string): FieldConfig[] {
    const useExecutorSelect = this.shouldUseExecutorSelect(currentExecutor);
    const versionOptions = this.versionOptions(currentExecutor);
    return [
      { name: 'code', type: 'text', label: 'tradeBot.field.code', width: '1/3', validation: [this.requiredRule()] },
      !useExecutorSelect
        ? { name: 'executor', type: 'text', label: 'tradeBot.field.executor', width: '1/3', validation: [this.requiredRule()] }
        : {
            name: 'executor',
            type: 'select',
            label: 'tradeBot.field.executor',
            width: '1/3',
            options: this.executors.map((item) => ({ label: item.executor, value: item.executor })),
            validation: [this.requiredRule()]
          },
      !useExecutorSelect || !versionOptions.length
        ? { name: 'executorVersion', type: 'text', label: 'tradeBot.field.executorVersion', width: '1/3' }
        : {
            name: 'executorVersion',
            type: 'select',
            label: 'tradeBot.field.executorVersion',
            width: '1/3',
            options: versionOptions
          },
      { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
      {
        name: 'formTemplateText',
        type: 'textarea',
        label: 'tradeBot.field.formTemplateJson',
        contentType: 'json',
        jsonValidationMessage: 'tradeBot.message.invalidJson',
        rows: 10,
        maxRows: 24,
        showZoomButton: true,
        width: 'full'
      }
    ];
  }

  private legacyFields(): FieldConfig[] {
    return [
      { name: 'indicatorsText', type: 'textarea', label: 'tradeBot.field.indicatorsJson', contentType: 'json', rows: 4, maxRows: 10, showZoomButton: true },
      { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true },
      { name: 'childRulesText', type: 'textarea', label: 'tradeBot.field.childRulesJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true },
      { name: 'overlayText', type: 'textarea', label: 'tradeBot.field.overlayJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true }
    ];
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
}
