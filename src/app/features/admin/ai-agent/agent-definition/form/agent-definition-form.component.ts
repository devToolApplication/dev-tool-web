import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { AgentDefinitionCreateDto, AgentDefinitionResponse, AgentDefinitionUpdateDto } from '../../../../../core/models/ai-agent/agent-definition.model';
import { AiModelResponse } from '../../../../../core/models/ai-agent/ai-model.model';
import { ExecutionPolicyConfigResponse } from '../../../../../core/models/ai-agent/execution-policy.model';
import { PromptTemplateResponse } from '../../../../../core/models/ai-agent/prompt-template.model';
import { CodexAgentMcpToolsResponse, CodexAgentOptionsResponse } from '../../../../../core/models/codex-agent/codex-agent-ask.model';
import { CodexSkillResponse } from '../../../../../core/models/codex-agent/codex-skill.model';
import { AgentDefinitionService } from '../../../../../core/services/ai-agent-service/agent-definition.service';
import { AiModelService } from '../../../../../core/services/ai-agent-service/ai-model.service';
import { ExecutionPolicyService } from '../../../../../core/services/ai-agent-service/execution-policy.service';
import { PromptTemplateService } from '../../../../../core/services/ai-agent-service/prompt-template.service';
import { CodexAgentAdminService } from '../../../../../core/services/codex-agent-service/codex-agent-admin.service';
import { CodexSkillService } from '../../../../../core/services/codex-agent-service/codex-skill.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { AGENT_DEFINITION_INITIAL_VALUE, AgentDefinitionManagementContext, getAgentDefinitionRoutes } from '../agent-definition.constants';

@Component({
  selector: 'app-agent-definition-form',
  standalone: false,
  templateUrl: './agent-definition-form.component.html'
})
export class AgentDefinitionFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'code', label: 'Code', width: '1/2', validation: [Rules.required('Code is required')] },
      { type: 'text', name: 'name', label: 'Name', width: '1/2', validation: [Rules.required('Name is required')] },
      {
        type: 'select',
        name: 'modelConfigId',
        label: 'Model',
        width: '1/2',
        optionsExpression: 'context.extra?.modelOptions || []'
      },
      {
        type: 'select',
        name: 'systemPromptTemplateId',
        label: 'Prompt Template',
        width: '1/2',
        optionsExpression: 'context.extra?.promptOptions || []'
      },
      {
        type: 'select',
        name: 'executionPolicyId',
        label: 'Execution Policy',
        width: '1/2',
        optionsExpression: 'context.extra?.policyOptions || []'
      },
      { type: 'checkbox', name: 'enabled', label: 'Enabled', width: '1/3' },
      { type: 'checkbox', name: 'defaultActive', label: 'Default Active', width: '1/3' },
      { type: 'select', name: 'status', label: 'Status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' },
      { type: 'textarea', name: 'executionPolicyJson', label: 'Execution Policy JSON Override', width: 'full', showZoomButton: true, contentType: 'json', jsonValidationMessage: 'Invalid JSON' },
      {
        type: 'group',
        name: 'codexConfig',
        label: 'Codex Runtime',
        width: 'full',
        children: [
          { type: 'checkbox', name: 'enabled', label: 'Codex Enabled', width: '1/3' },
          { type: 'text', name: 'model', label: 'Codex Model', width: '1/3' },
          {
            type: 'select',
            name: 'mode',
            label: 'Codex Mode',
            width: '1/3',
            optionsExpression: 'context.extra?.codexModeOptions || []',
            showClear: true
          },
          {
            type: 'select',
            name: 'approvalPolicy',
            label: 'Approval Policy',
            width: '1/3',
            options: [
              { label: 'Never', value: 'never' },
              { label: 'On Request', value: 'on-request' },
              { label: 'On Failure', value: 'on-failure' },
              { label: 'Untrusted', value: 'untrusted' }
            ],
            showClear: true
          },
          { type: 'checkbox', name: 'skipGitRepoCheck', label: 'Skip Git Repo Check', width: '1/3' },
          { type: 'checkbox', name: 'networkAccessEnabled', label: 'Network Access', width: '1/3' },
          { type: 'checkbox', name: 'webSearchEnabled', label: 'Web Search Enabled', width: '1/3' },
          {
            type: 'select',
            name: 'webSearchMode',
            label: 'Web Search Mode',
            width: '1/3',
            options: [
              { label: 'Disabled', value: 'disabled' },
              { label: 'Cached', value: 'cached' },
              { label: 'Live', value: 'live' }
            ],
            showClear: true
          },
          { type: 'text', name: 'workingDirectory', label: 'Working Directory', width: 'full' },
          {
            type: 'input-multi',
            name: 'additionalDirectories',
            label: 'Additional Directories',
            width: 'full',
            placeholder: 'Add directory path'
          },
          {
            type: 'select-multi',
            name: 'mcpServerIds',
            label: 'Allowed MCP Servers',
            width: 'full',
            optionsExpression: 'context.extra?.codexMcpServerOptions || []'
          },
          {
            type: 'select-multi',
            name: 'mcpToolKeys',
            label: 'Allowed MCP Tools',
            width: 'full',
            optionsExpression: 'context.extra?.codexMcpToolOptions || []',
            rules: {
              disabled: '!(model.codexConfig?.mcpServerIds?.length > 0)'
            },
            helpText: 'Format: serverId:toolName. Tool list loads from the selected MCP servers.'
          },
          {
            type: 'select-multi',
            name: 'skillIds',
            label: 'Codex Skills',
            width: 'full',
            optionsExpression: 'context.extra?.codexSkillOptions || []'
          },
          {
            type: 'textarea',
            name: 'agentsInstruction',
            label: 'AGENTS.md Instructions',
            width: 'full',
            rows: 12,
            showZoomButton: true
          }
        ]
      }
    ]
  };

  editId: string | null = null;
  loading = false;
  formInitialValue: AgentDefinitionCreateDto = this.createInitialValue();
  readonly formVisible = signal(true);
  private readonly managementContext: AgentDefinitionManagementContext;
  private readonly routes: ReturnType<typeof getAgentDefinitionRoutes>;
  private readonly mcpServerLabelMap: Record<string, string> = {};
  private readonly mcpToolOptionCatalog: Record<string, { label: string; value: string }[]> = {};

  constructor(
    private readonly agentDefinitionService: AgentDefinitionService,
    private readonly aiModelService: AiModelService,
    private readonly promptTemplateService: PromptTemplateService,
    private readonly executionPolicyService: ExecutionPolicyService,
    private readonly codexAgentAdminService: CodexAgentAdminService,
    private readonly codexSkillService: CodexSkillService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    this.managementContext = this.route.snapshot.data['managementContext'] === 'codex' ? 'codex' : 'ai';
    this.routes = getAgentDefinitionRoutes(this.managementContext);
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  get pageTitle(): string {
    if (this.managementContext === 'codex') {
      return this.editId ? 'Edit Codex Agent' : 'Create Codex Agent';
    }
    return this.editId ? 'Edit Agent Definition' : 'Create Agent Definition';
  }

  get pageDescription(): string {
    return this.managementContext === 'codex'
      ? 'Configure Codex runtime, skills, MCP servers and allowed MCP tools for this agent.'
      : 'Configure agent, model, tools, prompt template and execution policy.';
  }

  onSubmitForm(model: AgentDefinitionCreateDto): void {
    const normalizedMcpServerIds = this.normalizeStringList(model.codexConfig?.mcpServerIds);
    const payload: AgentDefinitionCreateDto = {
      ...model,
      code: model.code?.trim() || '',
      name: model.name?.trim() || '',
      description: model.description?.trim() || '',
      executionPolicyJson: model.executionPolicyJson?.trim() || '',
      codexConfig: model.codexConfig
        ? {
            ...model.codexConfig,
            model: model.codexConfig.model?.trim() || '',
            mode: model.codexConfig.mode?.trim() || '',
            approvalPolicy: model.codexConfig.approvalPolicy?.trim() || '',
            workingDirectory: model.codexConfig.workingDirectory?.trim() || '',
            additionalDirectories: (model.codexConfig.additionalDirectories ?? []).map((item) => item?.trim()).filter((item) => !!item) as string[],
            mcpServerIds: normalizedMcpServerIds,
            mcpToolKeys: this.normalizeMcpToolKeys(normalizedMcpServerIds, model.codexConfig.mcpToolKeys),
            skillIds: (model.codexConfig.skillIds ?? []).filter((item) => !!item),
            agentsInstruction: model.codexConfig.agentsInstruction?.trim() || ''
          }
        : undefined
    };
    const request$ = this.editId
      ? this.agentDefinitionService.update(this.editId, payload as AgentDefinitionUpdateDto)
      : this.agentDefinitionService.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t(this.editId ? 'updateSuccess' : 'createSuccess'));
        void this.router.navigate([this.routes.list]);
      },
      error: () => this.toastService.error('Save agent definition failed')
    });
  }

  onValueChange(model: AgentDefinitionCreateDto): void {
    this.syncMcpToolOptions(model.codexConfig?.mcpServerIds ?? []);
  }

  private loadOptions(): void {
    this.loading = true;
    this.loadingService.track(
      forkJoin({
        models: this.aiModelService.getAll().pipe(catchError(() => of([] as AiModelResponse[]))),
        prompts: this.promptTemplateService.getAll().pipe(catchError(() => of([] as PromptTemplateResponse[]))),
        policies: this.executionPolicyService.getAll().pipe(catchError(() => of([] as ExecutionPolicyConfigResponse[]))),
        codexOptions: this.codexAgentAdminService.getOptions().pipe(catchError(() => of({
          defaultModel: '',
          defaultMode: '',
          models: [],
          modes: [],
          mcpServers: [],
          agents: []
        } as CodexAgentOptionsResponse))),
        codexSkills: this.codexSkillService.getAll({ enabled: true }).pipe(catchError(() => of([] as CodexSkillResponse[])))
      })
    ).pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ models, prompts, policies, codexOptions, codexSkills }) => {
        this.formContext.extra = {
          modelOptions: this.toModelOptions(models),
          promptOptions: this.toPromptOptions(prompts),
          policyOptions: this.toPolicyOptions(policies),
          codexModeOptions: this.toCodexModeOptions(codexOptions),
          codexMcpServerOptions: this.toCodexMcpServerOptions(codexOptions),
          codexMcpToolOptions: [],
          codexSkillOptions: this.toCodexSkillOptions(codexSkills)
        };
        Object.assign(this.mcpServerLabelMap, this.toCodexMcpServerLabelMap(codexOptions));
        this.bindRouteMode();
      },
      error: () => {
        this.formContext.extra = {
          modelOptions: [],
          promptOptions: [],
          policyOptions: [],
          codexModeOptions: [],
          codexMcpServerOptions: [],
          codexMcpToolOptions: [],
          codexSkillOptions: []
        };
        this.toastService.error('Load agent form dependencies failed');
        this.bindRouteMode();
      }
    });
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
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = this.createInitialValue();
      this.syncMcpToolOptions(this.formInitialValue.codexConfig?.mcpServerIds ?? []);
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.agentDefinitionService.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: AgentDefinitionResponse) => {
        this.formInitialValue = {
          code: detail.code,
          name: detail.name,
          description: detail.description ?? '',
          systemPromptTemplateId: detail.systemPromptTemplateId ?? '',
          modelConfigId: detail.modelConfigId ?? '',
          executionPolicyId: detail.executionPolicyId ?? '',
          executionPolicyJson: detail.executionPolicyJson ?? '',
          enabled: detail.enabled ?? true,
          defaultActive: detail.defaultActive ?? false,
          codexConfig: {
            enabled: detail.codexConfig?.enabled ?? false,
            model: detail.codexConfig?.model ?? '',
            mode: detail.codexConfig?.mode ?? '',
            approvalPolicy: detail.codexConfig?.approvalPolicy ?? 'never',
            workingDirectory: detail.codexConfig?.workingDirectory ?? '',
            additionalDirectories: detail.codexConfig?.additionalDirectories ?? [],
            skipGitRepoCheck: detail.codexConfig?.skipGitRepoCheck ?? true,
            networkAccessEnabled: detail.codexConfig?.networkAccessEnabled ?? true,
            webSearchEnabled: detail.codexConfig?.webSearchEnabled ?? false,
            webSearchMode: detail.codexConfig?.webSearchMode ?? 'disabled',
            mcpServerIds: detail.codexConfig?.mcpServerIds ?? [],
            mcpToolKeys: detail.codexConfig?.mcpToolKeys ?? [],
            skillIds: detail.codexConfig?.skillIds ?? [],
            agentsInstruction: detail.codexConfig?.agentsInstruction ?? ''
          },
          status: detail.status ?? 'ACTIVE'
        };
        this.syncMcpToolOptions(detail.codexConfig?.mcpServerIds ?? [], detail.codexConfig?.mcpToolKeys ?? []);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load agent definition detail failed');
        void this.router.navigate([this.routes.list]);
      }
    });
  }

  private createInitialValue(): AgentDefinitionCreateDto {
    return JSON.parse(JSON.stringify(AGENT_DEFINITION_INITIAL_VALUE)) as AgentDefinitionCreateDto;
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toModelOptions(items: AiModelResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.modelName}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private toPromptOptions(items: PromptTemplateResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name} (${item.templateType})`, value: item.id }));
  }

  private toPolicyOptions(items: ExecutionPolicyConfigResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private toCodexModeOptions(options: CodexAgentOptionsResponse): { label: string; value: string }[] {
    return (options.modes ?? []).map((item) => ({ label: item.label, value: item.value }));
  }

  private toCodexMcpServerOptions(options: CodexAgentOptionsResponse): { label: string; value: string }[] {
    return (options.mcpServers ?? [])
      .filter((item) => item.enabled !== false)
      .map((item) => ({ label: item.label, value: item.value }));
  }

  private toCodexMcpServerLabelMap(options: CodexAgentOptionsResponse): Record<string, string> {
    return (options.mcpServers ?? []).reduce<Record<string, string>>((result, item) => {
      result[item.value] = item.label || item.value;
      return result;
    }, {});
  }

  private toCodexSkillOptions(items: CodexSkillResponse[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: `${item.name}${item.code ? ` (${item.code})` : ''}`, value: item.id }));
  }

  private syncMcpToolOptions(serverIds: string[], selectedToolKeys: string[] = []): void {
    const normalizedServerIds = this.normalizeStringList(serverIds);
    if (normalizedServerIds.length === 0) {
      this.updateFormExtra({ codexMcpToolOptions: [] });
      return;
    }

    const missingServerIds = normalizedServerIds.filter((serverId) => !this.mcpToolOptionCatalog[serverId]);
    if (missingServerIds.length === 0) {
      this.updateMcpToolOptions(normalizedServerIds, selectedToolKeys);
      return;
    }

    this.loadingService.track(
      forkJoin(
        missingServerIds.map((serverId) =>
          this.codexAgentAdminService.getMcpServerTools(serverId).pipe(
            catchError(() =>
              of({
                server: {
                  value: serverId,
                  label: this.mcpServerLabelMap[serverId] || serverId,
                  enabled: true
                },
                tools: []
              } as CodexAgentMcpToolsResponse)
            )
          )
        )
      )
    ).subscribe({
      next: (responses) => {
        responses.forEach((response) => {
          const serverId = response.server?.value || '';
          if (!serverId) {
            return;
          }
          this.mcpToolOptionCatalog[serverId] = (response.tools ?? []).map((tool) => ({
            label: `[${this.mcpServerLabelMap[serverId] || serverId}] ${tool.name}`,
            value: `${serverId}:${tool.name}`
          }));
        });
        this.updateMcpToolOptions(normalizedServerIds, selectedToolKeys);
      },
      error: () => {
        this.toastService.error('Load MCP tool options failed');
        this.updateMcpToolOptions(normalizedServerIds, selectedToolKeys);
      }
    });
  }

  private updateMcpToolOptions(serverIds: string[], selectedToolKeys: string[] = []): void {
    const options = serverIds.flatMap((serverId) => this.mcpToolOptionCatalog[serverId] ?? []);
    const mergedOptions = [...options];
    selectedToolKeys.forEach((toolKey) => {
      if (!toolKey || mergedOptions.some((item) => item.value === toolKey)) {
        return;
      }
      const [serverId, ...toolParts] = toolKey.split(':');
      const toolName = toolParts.join(':');
      mergedOptions.push({
        label: `[${this.mcpServerLabelMap[serverId] || serverId}] ${toolName || toolKey}`,
        value: toolKey
      });
    });
    this.updateFormExtra({ codexMcpToolOptions: mergedOptions });
  }

  private updateFormExtra(extra: Record<string, unknown>): void {
    this.formContext.extra = {
      ...(this.formContext.extra ?? {}),
      ...extra
    };
  }

  private normalizeStringList(values: string[] | undefined | null): string[] {
    return Array.from(new Set((values ?? []).map((item) => item?.trim()).filter((item) => !!item) as string[]));
  }

  private normalizeMcpToolKeys(serverIds: string[], toolKeys: string[] | undefined | null): string[] {
    const allowedServers = new Set(serverIds);
    return this.normalizeStringList(toolKeys).filter((toolKey) => {
      const [serverId] = toolKey.split(':');
      return !!serverId && allowedServers.has(serverId);
    });
  }
}
