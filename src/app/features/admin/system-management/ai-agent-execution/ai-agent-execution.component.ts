import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { AiAgentExecutionService } from '../../../../core/services/ai-agent-service/ai-agent-execution.service';
import {
  AiAgentAvailableAgent,
  AiAgentExecutionItem,
  AiAgentExecutionUsage,
  AiAgentSseEvent
} from '../../../../core/models/ai-agent/ai-agent-execution.model';
import { AgentRoleType } from '../../../../core/models/ai-agent/ai-agent-catalog.model';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { PageHeaderStatus } from '../../../../shared/ui/layout/page-header/page-header.component';
import { ActionToolbarAction } from '../../../../shared/ui/layout/action-toolbar/action-toolbar.component';
import { SelectOption } from '../../../../shared/component/select/select';

type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

interface AiAgentExecutionTranscript {
  selectedAgent: AiAgentAvailableAgent | null;
  prompt: string;
  status: ExecutionStatus;
  elapsedMs: number;
  usage: AiAgentExecutionUsage | null;
  items: AiAgentExecutionItem[];
  generatedAt: string;
}

@Component({
  selector: 'app-ai-agent-execution',
  standalone: false,
  templateUrl: './ai-agent-execution.component.html',
  styleUrls: ['./ai-agent-execution.component.scss']
})
export class AiAgentExecutionComponent implements OnInit, OnDestroy {

  // Form state
  agents = signal<AiAgentAvailableAgent[]>([]);
  filteredAgents = signal<AiAgentAvailableAgent[]>([]);
  selectedRole = signal<AgentRoleType | ''>('');
  selectedAgentCode = signal<string>('');
  prompt = signal<string>('');

  // Execution state
  status = signal<ExecutionStatus>('idle');
  items = signal<AiAgentExecutionItem[]>([]);
  usage = signal<AiAgentExecutionUsage | null>(null);
  errorMessage = signal<string | null>(null);
  startTime = signal<number>(0);
  elapsedMs = signal<number>(0);

  readonly roleSelectOptions: SelectOption[] = [
    { label: 'Tất cả', value: '' },
    { label: 'BA', value: 'BA' },
    { label: 'Dev', value: 'DEV' },
    { label: 'QA', value: 'QA' },
    { label: 'Review', value: 'REVIEW' },
    { label: 'System', value: 'SYSTEM' },
    { label: 'Custom', value: 'CUSTOM' }
  ];

  readonly agentSelectOptions = computed<SelectOption[]>(() =>
    this.filteredAgents().map(agent => ({
      label: `${agent.name} (${agent.roleType})`,
      value: agent.code
    }))
  );

  readonly pageStatus = computed<PageHeaderStatus | null>(() => {
    const s = this.status();
    const elapsed = (this.elapsedMs() / 1000).toFixed(1);
    switch (s) {
      case 'running':
        return { label: `Đang chạy — ${elapsed}s`, variant: 'info', icon: 'pi pi-spin pi-spinner' };
      case 'completed':
        return { label: `Hoàn thành — ${elapsed}s`, variant: 'success', icon: 'pi pi-check' };
      case 'error':
        return { label: 'Lỗi', variant: 'danger', icon: 'pi pi-times' };
      default:
        return null;
    }
  });

  readonly toolbarActions = computed<ActionToolbarAction[]>(() => {
    const s = this.status();
    const actions: ActionToolbarAction[] = [
      {
        id: 'execute',
        label: 'systemManagement.aiAgentExecution.action.execute',
        icon: 'pi pi-play',
        variant: 'primary',
        placement: 'primary',
        disabled: !this.canExecute(),
        loading: s === 'running'
      }
    ];

    if (s === 'running') {
      actions.push({
        id: 'stop',
        label: 'systemManagement.aiAgentExecution.action.stop',
        icon: 'pi pi-stop',
        variant: 'danger',
        placement: 'secondary'
      });
    }

    if (this.items().length > 0 && s !== 'running') {
      actions.push(
        {
          id: 'copy-transcript',
          label: 'systemManagement.aiAgentExecution.action.copyTranscript',
          icon: 'pi pi-copy',
          variant: 'ghost',
          placement: 'secondary'
        },
        {
          id: 'download-transcript',
          label: 'systemManagement.aiAgentExecution.action.downloadTranscript',
          icon: 'pi pi-download',
          variant: 'ghost',
          placement: 'secondary'
        },
        {
          id: 'clear',
          label: 'systemManagement.aiAgentExecution.action.clear',
          icon: 'pi pi-trash',
          variant: 'ghost',
          placement: 'secondary'
        }
      );
    }

    return actions;
  });

  private streamSub: Subscription | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly executionService: AiAgentExecutionService,
    private readonly keycloak: KeycloakService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  ngOnDestroy(): void {
    this.stopStream();
    this.stopTimer();
  }

  onRoleChange(value: string | number | boolean | null): void {
    const role = (value ?? '') as AgentRoleType | '';
    this.selectedRole.set(role);
    this.selectedAgentCode.set('');
    this.filterAgents();
  }

  onAgentChange(value: string | number | boolean | null): void {
    this.selectedAgentCode.set((value ?? '') as string);
  }

  onPromptChange(value: string | null): void {
    this.prompt.set(value ?? '');
  }

  onActionClick(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'execute':
        this.executeStream();
        break;
      case 'stop':
        this.stopExecution();
        break;
      case 'copy-transcript':
        void this.copyTranscript();
        break;
      case 'download-transcript':
        this.downloadTranscript();
        break;
      case 'clear':
        this.clearOutput();
        break;
    }
  }

  canExecute(): boolean {
    return !!this.selectedAgentCode() && !!this.prompt().trim() && this.status() !== 'running';
  }

  executeStream(): void {
    if (!this.canExecute()) return;

    this.resetExecution();
    this.status.set('running');
    this.startTime.set(Date.now());
    this.startTimer();

    const token = this.keycloak.token ?? '';

    this.streamSub = this.executionService.stream(
      { agentCode: this.selectedAgentCode(), prompt: this.prompt().trim() },
      token
    ).subscribe({
      next: (event) => this.handleSseEvent(event),
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err.message || 'Connection error');
        this.stopTimer();
      },
      complete: () => {
        if (this.status() === 'running') {
          this.status.set('completed');
        }
        this.stopTimer();
      }
    });
  }

  stopExecution(): void {
    this.stopStream();
    this.stopTimer();
    if (this.status() === 'running') {
      this.status.set('idle');
    }
  }

  clearOutput(): void {
    this.resetExecution();
  }

  getSelectedAgent(): AiAgentAvailableAgent | undefined {
    return this.agents().find(a => a.code === this.selectedAgentCode());
  }

  async copyTranscript(): Promise<void> {
    if (!navigator.clipboard?.writeText) {
      this.toast.error('systemManagement.aiAgentExecution.toast.copyFailed');
      return;
    }

    try {
      await navigator.clipboard.writeText(this.buildTranscriptText());
      this.toast.success('systemManagement.aiAgentExecution.toast.copySuccess');
    } catch {
      this.toast.error('systemManagement.aiAgentExecution.toast.copyFailed');
    }
  }

  downloadTranscript(): void {
    const transcript = this.buildTranscript();
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-agent-transcript-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success('systemManagement.aiAgentExecution.toast.downloadSuccess');
  }

  // --- Private ---

  private buildTranscript(): AiAgentExecutionTranscript {
    return {
      selectedAgent: this.getSelectedAgent() ?? null,
      prompt: this.prompt().trim(),
      status: this.status(),
      elapsedMs: this.elapsedMs(),
      usage: this.usage(),
      items: this.items(),
      generatedAt: new Date().toISOString()
    };
  }

  private buildTranscriptText(): string {
    const transcript = this.buildTranscript();
    const agent = transcript.selectedAgent;
    const lines = [
      'AI Agent Execution Transcript',
      '',
      `Agent: ${agent ? `${agent.name} (${agent.code})` : '-'}`,
      `Role: ${agent?.roleType ?? '-'}`,
      `Model: ${agent?.modelName ?? '-'}`,
      `Status: ${transcript.status}`,
      `Elapsed: ${(transcript.elapsedMs / 1000).toFixed(1)}s`,
      `Generated At: ${transcript.generatedAt}`,
      '',
      'Prompt:',
      transcript.prompt || '-',
      '',
      'Usage:',
      transcript.usage
        ? `Input: ${transcript.usage.inputTokens}, Output: ${transcript.usage.outputTokens}, Cached: ${transcript.usage.cachedInputTokens ?? 0}, Reasoning: ${transcript.usage.reasoningOutputTokens ?? 0}`
        : '-',
      '',
      'Output:'
    ];

    transcript.items.forEach((item, index) => {
      lines.push('', `#${index + 1} ${item.type}`, this.formatTranscriptItem(item));
    });

    return lines.join('\n');
  }

  private formatTranscriptItem(item: AiAgentExecutionItem): string {
    switch (item.type) {
      case 'message':
      case 'reasoning':
        return item.text;
      case 'command':
        return [`Command: ${item.command}`, `Exit Code: ${item.exitCode ?? '-'}`, 'Output:', item.output].join('\n');
      case 'file_change':
        return item.changes.map(change => `${change.kind} ${change.path}`).join('\n');
      case 'tool_call':
        return [
          `Server: ${item.server || '-'}`,
          `Tool: ${item.tool}`,
          'Arguments:',
          JSON.stringify(item.arguments, null, 2),
          'Result:',
          item.result === undefined ? '-' : JSON.stringify(item.result, null, 2)
        ].join('\n');
    }
  }

  private loadAgents(): void {
    this.executionService.getAvailableAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
        this.filterAgents();
      },
      error: () => {
        this.toast.error('systemManagement.aiAgentExecution.toast.loadAgentsFailed');
      }
    });
  }

  private filterAgents(): void {
    const role = this.selectedRole();
    if (!role) {
      this.filteredAgents.set(this.agents());
    } else {
      this.filteredAgents.set(this.agents().filter(a => a.roleType === role));
    }
  }

  private handleSseEvent(event: AiAgentSseEvent): void {
    switch (event.type) {
      case 'item.completed':
        if (event.item) {
          this.items.update(items => [...items, event.item!]);
        }
        break;
      case 'item.started':
        break;
      case 'turn.completed':
        if (event.usage) {
          this.usage.set(event.usage);
        }
        break;
      case 'error':
        this.status.set('error');
        this.errorMessage.set(event.message ?? 'Unknown error');
        this.stopTimer();
        break;
      case 'done':
        this.status.set('completed');
        this.stopTimer();
        break;
    }
  }

  private resetExecution(): void {
    this.stopStream();
    this.stopTimer();
    this.status.set('idle');
    this.items.set([]);
    this.usage.set(null);
    this.errorMessage.set(null);
    this.elapsedMs.set(0);
  }

  private stopStream(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.elapsedMs.set(Date.now() - this.startTime());
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.elapsedMs.set(Date.now() - this.startTime());
  }
}
