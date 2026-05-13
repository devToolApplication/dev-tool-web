import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import {
  IndicatorChildConfig,
  IndicatorChildSlotResponse,
  ExecutorVersionResponse,
  IndicatorConfigDto,
  IndicatorConfigResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FieldConfig, FormConfig, FormContext, SelectOption } from '../../../../../../shared/ui/form-input/models/form-config.model';
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
  selector: 'app-indicator-config-form',
  standalone: false,
  templateUrl: './indicator-config-form.component.html'
})
export class IndicatorConfigFormComponent implements OnInit {
  formConfig: FormConfig = { fields: [] };
  formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.indicator.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'save', label: 'tradeBot.action.save', icon: 'pi pi-save', submitForm: true, type: 'submit' }
    ]
  };
  formInitialValue: Record<string, unknown> = this.toFormValue();
  private id: string | null = null;
  private executors: ExecutorVersionResponse[] = [];
  private indicatorConfigs: IndicatorConfigResponse[] = [];
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
    let payload: IndicatorConfigDto;
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
      .track(this.service.saveIndicatorConfig(this.id, payload))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('saveSuccess'));
          void this.router.navigate([TRADE_BOT_ROUTES.indicators]);
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
    const parsedTemplate = this.usesConfig(executor)
      ? tryParseFormTemplateText(normalizedModel['formTemplateText'])
      : { invalid: false };
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
    const detail$ = this.id ? this.service.getIndicatorConfig(this.id) : of(null);
    this.loadingService
      .track(
        forkJoin({
          executors: this.service.getIndicatorExecutors().pipe(catchError(() => of([] as ExecutorVersionResponse[]))),
          indicatorConfigs: this.service.getIndicatorConfigs().pipe(catchError(() => of([] as IndicatorConfigResponse[]))),
          detail: detail$
        })
      )
      .pipe(finalize(() => this.submitting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ executors, indicatorConfigs, detail }) => {
          this.executors = executors;
          this.indicatorConfigs = indicatorConfigs;
          if (detail) {
            this.applyExistingConfig(detail);
            return;
          }
          this.initializeCreateForm();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private toPayload(model: Record<string, unknown>): IndicatorConfigDto {
    const executor = String(model['executor'] ?? '');
    const usesConfig = this.usesConfig(executor);
    const template = usesConfig ? parseFormTemplateText(model['formTemplateText']) : undefined;
    const basePayload = {
      code: String(model['code'] ?? ''),
      executor,
      executorVersion: String(model['executorVersion'] ?? 'LATEST'),
      displayType: String(model['displayType'] ?? ''),
      status: String(model['status'] ?? 'ACTIVE')
    };

    if (!usesConfig) {
      return {
        ...basePayload,
        config: {},
        children: this.childrenFromSelections(asRecord(model['childSelections']), this.childSlots(executor)),
        overlay: parseJson(model['overlayText'], {})
      };
    }

    if (!template) {
      return {
        ...basePayload,
        config: parseJson(model['configText'], {}),
        children: parseJson(model['childrenText'], []),
        overlay: parseJson(model['overlayText'], {})
      };
    }

    return {
      ...basePayload,
      config: asRecord(model['config']),
      children: asArray(model['children']),
      overlay: asRecord(model['overlay']),
      formTemplate: template
    };
  }

  private toFormValue(value?: IndicatorConfigResponse): Record<string, unknown> {
    return {
      code: value?.code ?? '',
      executor: value?.executor ?? '',
      executorVersion: value?.executorVersion ?? 'LATEST',
      displayType: value?.displayType ?? '',
      status: value?.status ?? 'ACTIVE',
      config: value?.config ?? {},
      children: value?.children ?? [],
      childSelections: this.childrenToSelections(value?.children),
      overlay: value?.overlay ?? {},
      formTemplateText: formTemplateText(value?.formTemplate),
      configText: stringifyJson(value?.config, {}),
      childrenText: stringifyJson(value?.children, []),
      overlayText: stringifyJson(value?.overlay, {})
    };
  }

  private initializeCreateForm(): void {
    const executor = this.executors[0]?.executor ?? '';
    const executorVersion = this.executors[0]?.latestVersion ?? 'LATEST';
    const initialValue = { ...this.toFormValue(), executor, executorVersion };
    this.applyTemplateState(initialValue, undefined, executor);
  }

  private applyExistingConfig(value: IndicatorConfigResponse): void {
    const executorVersion = this.resolveVersion(value.executor, value.executorVersion);
    const initialValue = { ...this.toFormValue(value), executorVersion };
    const template = hasFormTemplateFields(value.formTemplate) ? cloneFormConfig(value.formTemplate) : undefined;
    this.applyTemplateState(initialValue, template, value.executor);
  }

  private applyTemplateState(model: Record<string, unknown>, template?: FormConfig, currentExecutor = ''): void {
    const effectiveTemplate = this.usesConfig(currentExecutor) ? template : undefined;
    this.currentFormTemplate = cloneFormConfig(effectiveTemplate);
    this.currentTemplateSignature = formTemplateSignature(effectiveTemplate);
    this.currentExecutor = currentExecutor;
    this.formInitialValue = this.withLegacyTexts(model);
    this.formConfig = this.buildFormConfig(this.currentFormTemplate, currentExecutor);
  }

  private withLegacyTexts(value: Record<string, unknown>): Record<string, unknown> {
    return {
      ...value,
      childSelections: value['childSelections'] ?? this.childrenToSelections(asArray<IndicatorChildConfig>(value['children'])),
      configText: value['configText'] ?? stringifyJson(value['config'], {}),
      childrenText: value['childrenText'] ?? stringifyJson(value['children'], []),
      overlayText: value['overlayText'] ?? stringifyJson(value['overlay'], {})
    };
  }

  private buildFormConfig(template?: FormConfig, currentExecutor = ''): FormConfig {
    const templateFields = !this.usesConfig(currentExecutor)
      ? this.compositeFields(currentExecutor)
      : hasFormTemplateFields(template)
        ? template.fields
        : this.legacyFields();
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
      { name: 'displayType', type: 'text', label: 'tradeBot.field.displayType', width: '1/3' },
      { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' },
      ...(!this.usesConfig(currentExecutor)
        ? []
        : [
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
            } as FieldConfig
          ])
    ];
  }

  private compositeFields(currentExecutor: string): FieldConfig[] {
    return [
      ...this.childSlotFields(currentExecutor),
      this.overlayTextField()
    ];
  }

  private childSlotFields(currentExecutor: string): FieldConfig[] {
    const slots = this.childSlots(currentExecutor);
    if (!slots.length) {
      return [];
    }
    return [
      {
        name: 'childSelections',
        type: 'group',
        label: 'tradeBot.template.children',
        width: 'full',
        children: slots.map((slot) => ({
          name: slot.slotCode,
          type: slot.multiple ? 'select-multi' : 'select',
          label: slot.labelKey || `tradeBot.indicator.childSlot.${slot.slotCode}`,
          options: this.childOptions(slot),
          showClear: !slot.required,
          width: '1/2',
          validation: slot.required ? [this.requiredRule()] : []
        }))
      }
    ];
  }

  private legacyFields(): FieldConfig[] {
    return [
      { name: 'configText', type: 'textarea', label: 'tradeBot.field.configJson', contentType: 'json', rows: 8, maxRows: 16, showZoomButton: true },
      { name: 'childrenText', type: 'textarea', label: 'tradeBot.field.childrenJson', contentType: 'json', rows: 5, maxRows: 12, showZoomButton: true },
      this.overlayTextField()
    ];
  }

  private overlayTextField(): FieldConfig {
    return {
      name: 'overlayText',
      type: 'textarea',
      label: 'tradeBot.field.overlayJson',
      contentType: 'json',
      rows: 5,
      maxRows: 12,
      showZoomButton: true,
      width: 'full'
    };
  }

  private childOptions(slot: IndicatorChildSlotResponse): SelectOption[] {
    const acceptedExecutors = (slot.acceptedExecutors ?? []).map((executor) => executor.toUpperCase());
    return this.indicatorConfigs
      .filter((item) => item.id !== this.id)
      .filter((item) => !acceptedExecutors.length || acceptedExecutors.includes(String(item.executor ?? '').toUpperCase()))
      .map((item) => ({
        label: `${item.code} - ${item.executor}/${item.executorVersion}${item.status ? ` [${item.status}]` : ''}`,
        value: item.code
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private childrenFromSelections(selections: Record<string, unknown>, slots: IndicatorChildSlotResponse[]): IndicatorChildConfig[] {
    return slots.flatMap((slot) => {
      const rawValue = selections[slot.slotCode];
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      return values
        .map((value) => stringValue(value))
        .filter((value) => value)
        .map((indicatorCode) => ({ slotCode: slot.slotCode, indicatorCode, config: {} }));
    });
  }

  private childrenToSelections(children?: IndicatorChildConfig[]): Record<string, unknown> {
    const selections: Record<string, unknown> = {};
    (children ?? []).forEach((child) => {
      if (!child?.slotCode || !child.indicatorCode) {
        return;
      }
      if (selections[child.slotCode]) {
        const currentValue = selections[child.slotCode];
        selections[child.slotCode] = Array.isArray(currentValue)
          ? [...currentValue, child.indicatorCode]
          : [currentValue, child.indicatorCode];
        return;
      }
      selections[child.slotCode] = child.indicatorCode;
    });
    return selections;
  }

  private childSlots(executor: string): IndicatorChildSlotResponse[] {
    return this.executorMeta(executor)?.childSlots ?? [];
  }

  private usesConfig(executor: string): boolean {
    return this.executorMeta(executor)?.usesConfig ?? true;
  }

  private executorMeta(executor: string): ExecutorVersionResponse | undefined {
    return this.executors.find((item) => item.executor === executor);
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
