import { Component, DestroyRef, OnInit, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../../core/constants/system.constants';
import { AiAgentConfigCreateDto, AiAgentConfigResponse, AiAgentConfigUpdateDto } from '../../../../../../core/models/ai-agent/ai-agent-config.model';
import { AgentDefinitionResponse } from '../../../../../../core/models/ai-agent/agent-definition.model';
import { AiModelResponse } from '../../../../../../core/models/ai-agent/ai-model.model';
import { AiAgentConfigService } from '../../../../../../core/services/ai-agent-service/ai-agent-config.service';
import { AgentDefinitionService } from '../../../../../../core/services/ai-agent-service/agent-definition.service';
import { AiModelService } from '../../../../../../core/services/ai-agent-service/ai-model.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BaseCrudPageComponent } from '../../../../../../shared/ui/base-crud-page/base-crud-page.component';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../../shared/ui/form-input/utils/validation-rules';
import { toEntityRefOptions, toUniqueTextOptions } from '../../../../../form-option-utils';
import { AI_AGENT_CONFIG_INITIAL_VALUE, AI_AGENT_CONFIG_ROUTES } from '../ai-agent-config.constants';

@Component({
  selector: 'app-ai-agent-config-form',
  standalone: false,
  templateUrl: './ai-agent-config-form.component.html'
})
export class AiAgentConfigFormComponent implements OnInit {
  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'auto-complete',
        name: 'category',
        label: 'category',
        width: '1/2',
        optionsExpression: 'context.extra?.categoryOptions || []',
        validation: [Rules.required('systemManagement.validation.categoryRequired')]
      },
      {
        type: 'auto-complete',
        name: 'key',
        label: 'key',
        width: '1/2',
        optionsExpression: 'context.extra?.keyOptions || []',
        validation: [Rules.required('systemManagement.validation.keyRequired')]
      },
      {
        type: 'auto-complete',
        name: 'configGroup',
        label: 'systemManagement.field.configGroup',
        width: '1/2',
        optionsExpression: 'context.extra?.configGroupOptions || []'
      },
      {
        type: 'select',
        name: 'valueType',
        label: 'systemManagement.field.valueType',
        width: '1/2',
        options: [
          { label: 'systemManagement.valueType.string', value: 'STRING' },
          { label: 'systemManagement.valueType.integer', value: 'INTEGER' },
          { label: 'systemManagement.valueType.boolean', value: 'BOOLEAN' },
          { label: 'systemManagement.valueType.json', value: 'JSON' },
          { label: 'systemManagement.valueType.decimal', value: 'DECIMAL' }
        ]
      },
      {
        type: 'select',
        name: 'scopeType',
        label: 'systemManagement.field.scopeType',
        width: '1/2',
        options: [
          { label: 'systemManagement.scopeType.global', value: 'GLOBAL' },
          { label: 'systemManagement.scopeType.channel', value: 'CHANNEL' },
          { label: 'systemManagement.scopeType.agent', value: 'AGENT' },
          { label: 'systemManagement.scopeType.model', value: 'MODEL' },
          { label: 'systemManagement.scopeType.tool', value: 'TOOL' },
          { label: 'systemManagement.scopeType.user', value: 'USER' }
        ]
      },
      {
        type: 'auto-complete',
        name: 'scopeRef',
        label: 'systemManagement.field.scopeRef',
        width: '1/2',
        optionsExpression: 'context.extra?.scopeRefOptions?.[model.scopeType || "GLOBAL"] || []'
      },
      { type: 'checkbox', name: 'enabled', label: 'enabled', width: '1/2' },
      { type: 'select', name: 'status', label: 'status', width: '1/2', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'value', label: 'value', width: 'full', showZoomButton: true, validation: [Rules.required('systemManagement.validation.valueRequired')] },
      { type: 'textarea', name: 'description', label: 'description', width: 'full' }
    ]
  };

  editId: string | null = null;
  readonly loading = signal(false);
  formInitialValue: AiAgentConfigCreateDto = { ...AI_AGENT_CONFIG_INITIAL_VALUE };
  readonly formVisible = signal(true);

  constructor(
    private readonly service: AiAgentConfigService,
    private readonly agentDefinitionService: AgentDefinitionService,
    private readonly aiModelService: AiModelService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    this.loading.set(true);
    this.loadingService.track(
      forkJoin({
        configs: this.service.getAll().pipe(catchError(() => of([] as AiAgentConfigResponse[]))),
        agents: this.agentDefinitionService.getAll().pipe(catchError(() => of([] as AgentDefinitionResponse[]))),
        models: this.aiModelService.getAll().pipe(catchError(() => of([] as AiModelResponse[])))
      })
    ).pipe(finalize(() => this.loading.set(false))).subscribe(({ configs, agents, models }) => {
      this.formContext.extra = {
        categoryOptions: toUniqueTextOptions(configs, (item) => item.category),
        keyOptions: toUniqueTextOptions(configs, (item) => item.key),
        configGroupOptions: toUniqueTextOptions(configs, (item) => item.configGroup),
        scopeRefOptions: {
          GLOBAL: [],
          CHANNEL: toUniqueTextOptions(configs.filter((item) => item.scopeType === 'CHANNEL'), (item) => item.scopeRef),
          AGENT: toEntityRefOptions(
            agents,
            (item) => item.id,
            (item) => `${item.name}${item.code ? ` (${item.code})` : ''}`
          ),
          MODEL: toEntityRefOptions(
            models,
            (item) => item.id,
            (item) => `${item.modelName}${item.code ? ` (${item.code})` : ''}`
          ),
          TOOL: toUniqueTextOptions(configs.filter((item) => item.scopeType === 'TOOL'), (item) => item.scopeRef),
          USER: toUniqueTextOptions(configs.filter((item) => item.scopeType === 'USER'), (item) => item.scopeRef)
        }
      };
      this.bindRouteMode();
    });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  onSubmitForm(model: AiAgentConfigCreateDto): void {
    const request$ = this.editId ? this.service.update(this.editId, model as AiAgentConfigUpdateDto) : this.service.create(model);
    this.loading.set(true);
    this.loadingService.track(request$).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        this.crudPage?.markFormPristine();
        void this.router.navigate([AI_AGENT_CONFIG_ROUTES.list]);
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.aiAgentConfig.toast.saveError'))
    });
  }

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  confirmDiscardChanges(): Promise<boolean> | boolean {
    return this.crudPage?.confirmDiscardChanges() ?? true;
  }

  private rerenderForm(): void {
    this.formContext = { ...this.formContext, extra: { ...(this.formContext.extra ?? {}) } };
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...AI_AGENT_CONFIG_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading.set(true);
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (detail: AiAgentConfigResponse) => {
        this.formInitialValue = { ...detail };
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error(this.i18nService.t('systemManagement.aiAgentConfig.toast.loadDetailError'));
        void this.router.navigate([AI_AGENT_CONFIG_ROUTES.list]);
      }
    });
  }
}
