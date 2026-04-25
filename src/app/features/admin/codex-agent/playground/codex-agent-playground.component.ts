import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  CodexAgentAskRequest,
  CodexAgentAskResponse,
  CodexAgentMcpTool,
  CodexAgentOptionItem,
  CodexAgentOptionsResponse,
  CodexAgentProfile
} from '../../../../core/models/codex-agent/codex-agent-ask.model';
import { CodexAgentAdminService } from '../../../../core/services/codex-agent-service/codex-agent-admin.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../shared/ui/form-input/utils/validation-rules';

type CodexPlaygroundFormValue = CodexAgentAskRequest;

const PLAYGROUND_INITIAL_VALUE: CodexPlaygroundFormValue = {
  agentId: '',
  model: '',
  mode: '',
  userPrompt: ''
};

@Component({
  selector: 'app-codex-agent-playground',
  standalone: false,
  templateUrl: './codex-agent-playground.component.html',
  styleUrl: './codex-agent-playground.component.css'
})
export class CodexAgentPlaygroundComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly formConfig: FormConfig = {
    fields: [
      {
        type: 'select',
        name: 'agentId',
        label: 'Agent',
        width: '1/2',
        optionsExpression: 'context.extra?.agentOptions || []',
        showClear: true
      },
      {
        type: 'select',
        name: 'model',
        label: 'Model Override',
        width: '1/4',
        optionsExpression: 'context.extra?.modelOptions || []',
        showClear: true
      },
      {
        type: 'select',
        name: 'mode',
        label: 'Mode Override',
        width: '1/4',
        optionsExpression: 'context.extra?.modeOptions || []',
        showClear: true
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'User Prompt',
        width: 'full',
        rows: 10,
        showZoomButton: true,
        validation: [Rules.required('User prompt is required')]
      }
    ]
  };

  readonly formVisible = signal(true);

  loading = false;
  running = false;
  formInitialValue: CodexPlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  formValue: CodexPlaygroundFormValue = { ...PLAYGROUND_INITIAL_VALUE };
  result: CodexAgentAskResponse | null = null;
  selectedMcpServerId = '';
  mcpTools: CodexAgentMcpTool[] = [];
  mcpToolsLoading = false;
  mcpToolsError = '';
  optionsSnapshot: CodexAgentOptionsResponse = {
    defaultModel: '',
    defaultMode: '',
    models: [],
    modes: [],
    mcpServers: [],
    agents: []
  };

  constructor(
    private readonly codexAgentAdminService: CodexAgentAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  onValueChange(model: CodexPlaygroundFormValue): void {
    const previousAgentId = this.formValue.agentId || '';
    const nextValue: CodexPlaygroundFormValue = {
      agentId: model?.agentId || '',
      model: model?.model || '',
      mode: model?.mode || '',
      userPrompt: model?.userPrompt || ''
    };

    if (nextValue.agentId && nextValue.agentId !== previousAgentId) {
      const agent = this.selectedAgentById(nextValue.agentId);
      if (agent) {
        nextValue.model = nextValue.model || agent.codexModel || this.formInitialValue.model || '';
        nextValue.mode = nextValue.mode || agent.codexMode || this.formInitialValue.mode || '';
      }
    }

    this.formValue = nextValue;
  }

  onSubmitForm(model: CodexPlaygroundFormValue): void {
    const payload: CodexPlaygroundFormValue = {
      agentId: model.agentId?.trim() || '',
      model: model.model?.trim() || '',
      mode: model.mode?.trim() || '',
      userPrompt: model.userPrompt?.trim() || ''
    };

    if (!payload.userPrompt) {
      this.toastService.error('User prompt is required');
      return;
    }

    this.running = true;
    this.result = null;
    this.loadingService.track(this.codexAgentAdminService.ask(payload)).pipe(finalize(() => (this.running = false))).subscribe({
      next: (response) => {
        this.result = response;
        if (response.success) {
          this.toastService.info('Codex run completed');
        } else {
          this.toastService.error(response.errorMessage || 'Codex run failed');
        }
      },
      error: () => this.toastService.error('Codex run failed')
    });
  }

  onActionClick(actionId: string): void {
    if (actionId === 'clear-result') {
      this.clearResult();
    }
  }

  get selectedModelLabel(): string {
    return this.getOptionLabel('modelOptions', this.formValue.model || this.formInitialValue.model || '');
  }

  get selectedModeLabel(): string {
    return this.getOptionLabel('modeOptions', this.formValue.mode || this.formInitialValue.mode || '');
  }

  get selectedAgent(): CodexAgentProfile | null {
    return this.selectedAgentById(this.formValue.agentId || this.formInitialValue.agentId || '');
  }

  get enabledMcpServers() {
    return (this.optionsSnapshot.mcpServers ?? []).filter((item) => item.enabled !== false);
  }

  onMcpServerChange(serverId: string): void {
    this.selectedMcpServerId = serverId;
    this.mcpTools = [];
    this.mcpToolsError = '';
  }

  loadMcpTools(): void {
    if (!this.selectedMcpServerId) {
      this.toastService.error('Select an MCP server first');
      return;
    }

    this.mcpToolsLoading = true;
    this.mcpToolsError = '';
    this.mcpTools = [];
    this.loadingService.track(this.codexAgentAdminService.getMcpServerTools(this.selectedMcpServerId))
      .pipe(finalize(() => (this.mcpToolsLoading = false)))
      .subscribe({
        next: (response) => {
          this.mcpTools = response.tools ?? [];
          if (this.mcpTools.length === 0) {
            this.toastService.info('MCP server returned no tools');
          }
        },
        error: () => {
          this.mcpToolsError = 'Load MCP tools failed';
          this.toastService.error(this.mcpToolsError);
        }
      });
  }

  private loadOptions(): void {
    this.loading = true;
    this.loadingService.track(this.codexAgentAdminService.getOptions()).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (options) => {
        this.optionsSnapshot = options;
        this.formContext.extra = {
          agentOptions: this.toAgentOptions(options.agents),
          modelOptions: this.toFormOptions(options.models),
          modeOptions: this.toFormOptions(options.modes)
        };
        this.applyDefaults(options);
      },
      error: () => {
        this.formContext.extra = {
          agentOptions: [],
          modelOptions: [],
          modeOptions: []
        };
        this.toastService.error('Load Codex options failed');
        this.applyDefaults({
          defaultModel: '',
          defaultMode: '',
          models: [],
          modes: [],
          mcpServers: [],
          agents: []
        });
      }
    });
  }

  private applyDefaults(options: CodexAgentOptionsResponse): void {
    const requestedAgentId = this.route.snapshot.queryParamMap.get('agentId') || '';
    const selectedAgent = requestedAgentId ? this.selectedAgentById(requestedAgentId, options.agents) : null;
    const defaultModel = selectedAgent?.codexModel || options.defaultModel || options.models.find((entry) => entry.isDefault)?.value || '';
    const defaultMode = selectedAgent?.codexMode || options.defaultMode || options.modes.find((entry) => entry.isDefault)?.value || '';
    const nextValue: CodexPlaygroundFormValue = {
      agentId: selectedAgent?.id || '',
      model: defaultModel,
      mode: defaultMode,
      userPrompt: this.formValue.userPrompt || ''
    };
    this.formInitialValue = nextValue;
    this.formValue = { ...nextValue };
    this.rerenderForm();
  }

  private clearResult(): void {
    this.result = null;
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toFormOptions(items: CodexAgentOptionItem[]): { label: string; value: string }[] {
    return items.map((item) => ({ label: item.label, value: item.value }));
  }

  private toAgentOptions(items: CodexAgentProfile[]): { label: string; value: string }[] {
    return items
      .filter((item) => item.codexEnabled !== false)
      .map((item) => ({
        label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
        value: item.id
      }));
  }

  private getOptionLabel(optionKey: 'modelOptions' | 'modeOptions', value: string): string {
    if (!value) {
      return '-';
    }

    const options = this.formContext.extra?.[optionKey] ?? [];
    const match = options.find((item: { label: string; value: string }) => item.value === value);
    return match?.label ?? value;
  }

  private selectedAgentById(id: string, agents = this.optionsSnapshot.agents): CodexAgentProfile | null {
    if (!id) {
      return null;
    }
    return agents.find((item) => item.id === id) ?? null;
  }
}
