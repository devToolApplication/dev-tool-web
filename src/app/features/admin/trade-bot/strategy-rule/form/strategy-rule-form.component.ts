import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { StrategyRuleCreateDto, StrategyRuleResponse, StrategyRuleUpdateDto } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { TradeBotConfigService } from '../../../../../core/services/trade-bot-service/config.service';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CrudPageConfig } from '../../../../../shared/ui/base-crud-page/base-crud-page.model';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { STRATEGY_RULE_ROUTES } from '../strategy-rule.constants';
import {
  StrategyRuleFormValue,
  buildStrategyRuleFormConfig,
  buildStrategyRuleInitialValue,
  configureStrategyRuleDefinitions,
  getStrategyRuleDefaultCode,
  mapApiConfigToRuleConfig,
  mapRuleConfigToApiPayload,
  resolveStrategyRuleDefinition
} from './strategy-rule-form.factory';

@Component({
  selector: 'app-strategy-rule-form',
  standalone: false,
  templateUrl: './strategy-rule-form.component.html'
})
export class StrategyRuleFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formVisible = signal(true);
  private static readonly RULE_DEFINITIONS_CONFIG_CATEGORY = 'RULE_DEFINITIONS';
  private static readonly RULE_CONFIG_SCHEMAS_CATEGORY = 'RULE_CONFIG_SCHEMAS';

  editId: string | null = null;
  loading = false;
  saving = false;

  formConfig: FormConfig = buildStrategyRuleFormConfig(null);
  formInitialValue: StrategyRuleFormValue = buildStrategyRuleInitialValue(null);
  selectedRuleCode = this.formInitialValue.code;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tradeBotConfigService: TradeBotConfigService,
    private readonly service: StrategyRuleService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.bindRouteMode();
  }

  get ruleDefinition() {
    return resolveStrategyRuleDefinition(this.selectedRuleCode);
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
    const payload = this.buildPayload(model);
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
    if (!nextCode || nextCode === this.selectedRuleCode) {
      return;
    }

    this.selectedRuleCode = nextCode;
    this.formInitialValue = buildStrategyRuleInitialValue(nextCode, {
      code: nextCode,
      name: value.name ?? '',
      status: value.status ?? 'ACTIVE',
      description: value.description ?? ''
    });
    this.refreshForm(nextCode);
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
      .track(
        forkJoin({
          definitions: this.tradeBotConfigService
            .getAll({ category: StrategyRuleFormComponent.RULE_DEFINITIONS_CONFIG_CATEGORY })
            .pipe(catchError(() => of([]))),
          configSchemas: this.tradeBotConfigService
            .getAll({ category: StrategyRuleFormComponent.RULE_CONFIG_SCHEMAS_CATEGORY })
            .pipe(catchError(() => of([]))),
          rule: id ? this.service.getById(id) : of(null)
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ definitions, configSchemas, rule }) => {
          configureStrategyRuleDefinitions(definitions, configSchemas);

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
    this.selectedRuleCode = normalizedCode;
    this.formContext.mode = 'edit';
    this.formInitialValue = buildStrategyRuleInitialValue(normalizedCode, {
      code: normalizedCode,
      name: rule.name ?? '',
      status: rule.status,
      description: rule.description ?? '',
      configJson: mapApiConfigToRuleConfig(rule.configJson ?? {}, normalizedCode)
    });
    this.refreshForm(normalizedCode);
  }

  private resetCreateState(): void {
    const defaultCode = getStrategyRuleDefaultCode() ?? '';
    this.selectedRuleCode = defaultCode;
    this.formContext.mode = 'create';
    this.formInitialValue = buildStrategyRuleInitialValue(defaultCode);
    this.refreshForm(defaultCode);
  }

  private buildPayload(model: StrategyRuleFormValue): StrategyRuleCreateDto {
    return {
      code: model.code.trim().toUpperCase(),
      name: model.name.trim(),
      description: model.description.trim() || undefined,
      status: model.status,
      configJson: mapRuleConfigToApiPayload(model.configJson)
    };
  }

  private refreshForm(ruleCode: string): void {
    this.formConfig = buildStrategyRuleFormConfig(ruleCode);
    this.rerenderForm();
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }
}
