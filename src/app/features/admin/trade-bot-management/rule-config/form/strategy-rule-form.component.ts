import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of } from 'rxjs';
import { StrategyRuleCreateDto, StrategyRuleResponse, StrategyRuleUpdateDto } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { STRATEGY_RULE_ROUTES } from '../strategy-rule.constants';
import {
  StrategyRuleCodeDefinition,
  StrategyRuleFormValue,
  buildEmptyStrategyRuleDefinition,
  buildStrategyRuleDefinitionFromFormValue,
  buildStrategyRuleFormConfig,
  buildStrategyRuleInitialValue,
  mapApiConfigToRuleConfig,
  mapRuleConfigToApiPayload,
  mapRuleResponseToDefinition,
  parseRuleConfigFieldsPayload,
  parseRuleInitialValuePayload
} from './strategy-rule-form.factory';

@Component({
  selector: 'app-strategy-rule-form',
  standalone: false,
  templateUrl: './strategy-rule-form.component.html'
})
export class StrategyRuleFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formVisible = signal(true);

  editId: string | null = null;
  loading = false;
  saving = false;

  activeDefinition: StrategyRuleCodeDefinition = buildEmptyStrategyRuleDefinition();
  formConfig: FormConfig = buildStrategyRuleFormConfig(this.activeDefinition);
  formInitialValue: StrategyRuleFormValue = buildStrategyRuleInitialValue(this.activeDefinition);
  selectedRuleCode = this.formInitialValue.code;
  private fieldSchemaSignature = this.buildFieldSchemaSignature(this.activeDefinition);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: StrategyRuleService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.bindRouteMode();
  }

  get ruleDefinition() {
    return this.activeDefinition;
  }

  get pageConfig(): CrudPageConfig {
    return {
      title: this.editId ? 'tradeBot.strategyRule.form.editTitle' : 'tradeBot.strategyRule.form.createTitle',
      description: 'tradeBot.strategyRule.form.description',
      actions: [
        {
          id: 'back',
          label: 'tradeBot.back',
          icon: 'pi pi-arrow-left',
          buttonClass: 'p-button-text',
          goBack: true
        },
        {
          id: 'test',
          label: 'tradeBot.strategyRule.form.testAction',
          icon: 'pi pi-check-square',
          buttonClass: 'p-button-outlined',
          disabled: !this.editId
        },
        {
          id: 'save',
          label: 'tradeBot.strategyRule.form.saveAction',
          icon: 'pi pi-save',
          loading: this.saving,
          submitForm: true
        }
      ],
      infoSection: {
        title: this.ruleDefinition.label,
        description: this.ruleDefinition.description
      }
    };
  }

  onSubmitForm(model: StrategyRuleFormValue): void {
    let payload: StrategyRuleCreateDto;
    try {
      payload = this.buildPayload(model);
    } catch (error) {
      this.toastService.error(error instanceof Error ? error.message : this.i18nService.t('tradeBot.strategyRule.toast.saveError'));
      return;
    }

    const request$ = this.editId ? this.service.update(this.editId, payload as StrategyRuleUpdateDto) : this.service.create(payload);
    this.saving = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (rule) => {
        this.toastService.success(this.i18nService.t(this.editId ? 'tradeBot.strategyRule.toast.updateSuccess' : 'tradeBot.strategyRule.toast.createSuccess'));
        void this.router.navigate([STRATEGY_RULE_ROUTES.edit(rule.id)]);
      },
      error: (error) => this.toastService.error(error?.error?.errorMessage ?? this.i18nService.t('tradeBot.strategyRule.toast.saveError'))
    });
  }

  goTest(): void {
    if (!this.editId) {
      return;
    }
    void this.router.navigate([STRATEGY_RULE_ROUTES.test(this.editId)]);
  }

  onFormValueChange(value: StrategyRuleFormValue): void {
    const nextCode = String(value.code ?? '').trim().toUpperCase();
    let nextDefinition: StrategyRuleCodeDefinition;
    try {
      nextDefinition = buildStrategyRuleDefinitionFromFormValue(value);
    } catch {
      this.selectedRuleCode = nextCode;
      return;
    }

    this.selectedRuleCode = nextCode;
    this.activeDefinition = nextDefinition;

    const nextSignature = this.buildFieldSchemaSignature(nextDefinition);
    if (nextSignature === this.fieldSchemaSignature) {
      return;
    }

    this.fieldSchemaSignature = nextSignature;
    this.formInitialValue = {
      ...value,
      code: nextCode,
      configJson: {
        ...nextDefinition.initialValue,
        ...(value.configJson ?? {})
      }
    };
    this.refreshForm();
  }

  onPageAction(actionId: string): void {
    switch (actionId) {
      case 'test':
        this.goTest();
        return;
      default:
        return;
    }
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    this.editId = id;
    this.loading = true;
    this.loadingService
      .track(id ? this.service.getById(id) : of(null))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rule) => {
          if (rule) {
            this.patchEditState(rule);
          } else {
            this.resetCreateState();
          }
        },
        error: () => {
          this.toastService.error(this.i18nService.t('tradeBot.strategyRule.toast.loadFormError'));
          void this.router.navigate([STRATEGY_RULE_ROUTES.list]);
        }
      });
  }

  private patchEditState(rule: StrategyRuleResponse): void {
    const normalizedCode = String(rule.code ?? '').trim().toUpperCase();
    const definition = mapRuleResponseToDefinition(rule);
    this.activeDefinition = definition;
    this.fieldSchemaSignature = this.buildFieldSchemaSignature(definition);
    this.selectedRuleCode = normalizedCode;
    this.formContext.mode = 'edit';
    this.formInitialValue = buildStrategyRuleInitialValue(definition, {
      code: normalizedCode,
      name: rule.name ?? '',
      ruleGroupCode: rule.ruleGroupCode ?? '',
      ruleGroupLabel: rule.ruleGroupLabel ?? '',
      implementationCode: rule.implementationCode ?? '',
      status: rule.status,
      description: rule.description ?? '',
      configJson: mapApiConfigToRuleConfig(rule.configJson ?? {}, definition)
    });
    this.refreshForm();
  }

  private resetCreateState(): void {
    const definition = buildEmptyStrategyRuleDefinition();
    this.activeDefinition = definition;
    this.fieldSchemaSignature = this.buildFieldSchemaSignature(definition);
    this.selectedRuleCode = '';
    this.formContext.mode = 'create';
    this.formInitialValue = buildStrategyRuleInitialValue(definition);
    this.refreshForm();
  }

  private buildPayload(model: StrategyRuleFormValue): StrategyRuleCreateDto {
    return {
      code: model.code.trim().toUpperCase(),
      name: model.name.trim(),
      ruleGroupCode: model.ruleGroupCode.trim().toUpperCase() || undefined,
      ruleGroupLabel: model.ruleGroupLabel.trim() || undefined,
      implementationCode: model.implementationCode.trim().toUpperCase() || undefined,
      description: model.description.trim() || undefined,
      status: model.status,
      configFields: parseRuleConfigFieldsPayload(model.configFieldsJson),
      initialValue: parseRuleInitialValuePayload(model.initialValueJson),
      configJson: mapRuleConfigToApiPayload(model.configJson)
    };
  }

  private refreshForm(): void {
    this.formConfig = buildStrategyRuleFormConfig(this.activeDefinition);
    this.rerenderForm();
  }

  private buildFieldSchemaSignature(definition: StrategyRuleCodeDefinition): string {
    return JSON.stringify({
      configFields: definition.configFields
    });
  }

  private rerenderForm(): void {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    this.formVisible.set(false);
    window.setTimeout(() => {
      this.formVisible.set(true);
      window.requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    });
  }
}
