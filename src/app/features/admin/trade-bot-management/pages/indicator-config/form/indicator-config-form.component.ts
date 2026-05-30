import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
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
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { CrudPageConfig } from '../../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FieldConfig, FormConfig, FormContext, SelectOption } from '../../../../../../shared/ui/form-input/models/form-config.model';
import {
  asArray,
  asRecord,
  cloneFormConfig,
  formTemplateSignature,
  hasFormTemplateFields,
  stringValue
} from '../../../config-template-form.utils';
import { parseJson, stringifyJson, toUniqueTextOptions } from '../../../trade-bot-form-utils';
import { STATUS_OPTIONS, TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-indicator-config-form',
  standalone: false,
  templateUrl: './indicator-config-form.component.html'
})
export class IndicatorConfigFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formConfig: FormConfig = { fields: [] };
  formContext: FormContext = { user: null, mode: 'create' };
  readonly submitting = signal(false);
  readonly showPreview = signal(false);
  readonly previewPayload = signal<Record<string, unknown>>({});
  readonly pageConfig: CrudPageConfig = {
    title: 'tradeBot.indicator.formTitle',
    actions: [
      { id: 'back', label: 'tradeBot.action.back', icon: 'pi pi-arrow-left', goBack: true },
      { id: 'preview', label: 'tradeBot.action.preview', icon: 'pi pi-eye', severity: 'secondary' },
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
  private lastModel: Record<string, unknown> = {};

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

  onActionClick(actionId: string): void {
    if (actionId === 'preview') {
      this.openPreview();
    }
  }

  openPreview(): void {
    this.previewPayload.set({
      executor: stringValue(this.lastModel['executor']),
      executorVersion: stringValue(this.lastModel['executorVersion']),
      config: this.lastModel['config'] ?? {},
      children: this.lastModel['children'] ?? [],
      overlay: this.lastModel['overlay'] ?? {}
    });
    this.showPreview.set(true);
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
          this.crudPage?.markFormPristine();
          void this.router.navigate([TRADE_BOT_ROUTES.indicators]);
        },
        error: () => this.toastService.error(this.i18nService.t('saveError'))
      });
  }

  onValueChange(model: Record<string, unknown>): void {
    this.lastModel = model;
    const executor = stringValue(model['executor']);
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
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
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
    const template = usesConfig ? this.currentFormTemplate : undefined;
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
        overlay: asRecord(model['overlay'])
      };
    }

    if (!template) {
      return {
        ...basePayload,
        config: parseJson(model['configText'], {}),
        children: parseJson(model['childrenText'], []),
        overlay: asRecord(model['overlay'])
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
      configText: stringifyJson(value?.config, {}),
      childrenText: stringifyJson(value?.children, [])
    };
  }

  private initializeCreateForm(): void {
    const executor = this.executors[0]?.executor ?? '';
    const executorVersion = this.executors[0]?.latestVersion ?? 'LATEST';
    const initialValue = { ...this.toFormValue(), executor, executorVersion };
    this.applyTemplateState(initialValue, this.templateForExecutor(executor), executor);
  }

  private applyExistingConfig(value: IndicatorConfigResponse): void {
    const executorVersion = this.resolveVersion(value.executor, value.executorVersion);
    const initialValue = { ...this.toFormValue(value), executorVersion };
    const template = hasFormTemplateFields(value.formTemplate)
      ? cloneFormConfig(value.formTemplate)
      : this.templateForExecutor(value.executor);
    this.applyTemplateState(initialValue, template, value.executor);
  }

  private applyTemplateState(model: Record<string, unknown>, template?: FormConfig, currentExecutor = ''): void {
    const effectiveTemplate = this.usesConfig(currentExecutor) ? template : undefined;
    this.currentFormTemplate = cloneFormConfig(effectiveTemplate);
    this.currentTemplateSignature = formTemplateSignature(effectiveTemplate);
    this.currentExecutor = currentExecutor;
    this.formInitialValue = this.withLegacyTexts(model);
    this.formConfig = this.buildFormConfig(this.currentFormTemplate, currentExecutor);
    this.updateTemplateFallbackInfo(currentExecutor, this.currentFormTemplate);
  }

  private withLegacyTexts(value: Record<string, unknown>): Record<string, unknown> {
    return {
      ...value,
      childSelections: value['childSelections'] ?? this.childrenToSelections(asArray<IndicatorChildConfig>(value['children'])),
      configText: value['configText'] ?? stringifyJson(value['config'], {}),
      childrenText: value['childrenText'] ?? stringifyJson(value['children'], []),
      overlay: value['overlay'] ?? {}
    };
  }

  private buildFormConfig(template?: FormConfig, currentExecutor = ''): FormConfig {
    const templateFields = !this.usesConfig(currentExecutor)
      ? this.compositeFields(currentExecutor)
      : hasFormTemplateFields(template)
        ? this.templateFieldsWithCommonOverlay(template.fields)
        : this.legacyFields();
    return {
      fields: [...this.staticFieldGroups(currentExecutor), ...templateFields]
    };
  }

  private templateFieldsWithCommonOverlay(fields: FieldConfig[]): FieldConfig[] {
    const normalizedFields = fields.map((field) => this.normalizeTemplateField(field));
    return this.hasField(normalizedFields, 'overlay')
      ? normalizedFields
      : [...normalizedFields, this.overlayRecordField()];
  }

  private normalizeTemplateField(field: FieldConfig): FieldConfig {
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
      return {
        ...field,
        children: field.children?.map((child) => this.normalizeTemplateField(child))
      };
    }

    return field;
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

  private updateTemplateFallbackInfo(executor: string, template?: FormConfig): void {
    this.pageConfig.infoSection = executor && this.usesConfig(executor) && !hasFormTemplateFields(template)
      ? {
          title: 'tradeBot.message.missingFormTemplateTitle',
          description: 'tradeBot.message.missingIndicatorFormTemplateDescription'
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
          { name: 'displayType', type: 'select', label: 'tradeBot.field.displayType', options: this.displayTypeOptions(), width: '1/3' },
          { name: 'status', type: 'select', label: 'tradeBot.field.status', options: STATUS_OPTIONS, width: '1/3' }
        ]
      },
      {
        name: 'executorInfo',
        type: 'group',
        label: 'tradeBot.field.executor',
        width: 'full',
        flat: true,
        children: [
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

  private compositeFields(currentExecutor: string): FieldConfig[] {
    return [
      ...this.childSlotFields(currentExecutor),
      this.overlayRecordField()
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
      this.overlayRecordField(),
      this.advancedJsonGroup([
        this.jsonTextField('configText', 'tradeBot.field.configJson', 8, 16),
        this.jsonTextField('childrenText', 'tradeBot.field.childrenJson', 5, 12)
      ])
    ];
  }

  private overlayRecordField(label = 'tradeBot.template.overlay'): FieldConfig {
    return {
      name: 'overlay',
      type: 'group',
      label,
      width: 'full',
      collapsible: true,
      collapsed: true,
      children: [
        {
          name: 'color',
          type: 'color-picker',
          label: 'tradeBot.field.overlayColor',
          placeholder: '#2196F3',
          width: '1/3'
        },
        {
          name: 'lineWidth',
          type: 'select',
          label: 'tradeBot.field.overlayLineWidth',
          options: [
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 }
          ],
          width: '1/3'
        },
        {
          name: 'lineStyle',
          type: 'select',
          label: 'tradeBot.field.overlayLineStyle',
          options: [
            { label: 'Solid', value: 'SOLID' },
            { label: 'Dashed', value: 'DASHED' },
            { label: 'Dotted', value: 'DOTTED' }
          ],
          width: '1/3'
        }
      ]
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

  private templateForExecutor(executor: string): FormConfig | undefined {
    const template = this.executorMeta(executor)?.formTemplate;
    return hasFormTemplateFields(template) ? cloneFormConfig(template) : undefined;
  }

  private shouldUseExecutorSelect(executor: string): boolean {
    return this.executors.length > 0 && (!executor || this.executors.some((item) => item.executor === executor));
  }

  private versionOptions(executor: string): Array<{ label: string; value: string }> {
    const versions = this.executors.find((item) => item.executor === executor)?.versions ?? [];
    return versions.map((version) => ({ label: version, value: version }));
  }

  private displayTypeOptions(): SelectOption[] {
    return toUniqueTextOptions(this.indicatorConfigs, (indicator) => indicator.displayType);
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
