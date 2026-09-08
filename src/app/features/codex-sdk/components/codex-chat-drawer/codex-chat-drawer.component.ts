import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DrawerConfig } from '@shared/ui/overlay/drawer/drawer.component';
import { SelectOption } from '@shared/ui/primitives/select/select';
import {
  CodexAgentCatalogItem,
  CodexPromptRequest,
  CodexThreadDetail,
  CodexToolCall,
  CodexTurn,
} from '../../models/codex-sdk.model';
import { CodexSdkService } from '../../services/codex-sdk.service';

@Component({
  selector: 'app-codex-chat-drawer',
  standalone: false,
  templateUrl: './codex-chat-drawer.component.html',
  styleUrl: './codex-chat-drawer.component.scss',
})
export class CodexChatDrawerComponent implements OnInit, OnDestroy {
  private readonly codexService = inject(CodexSdkService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  readonly visible = signal<boolean>(false);
  readonly threadId = signal<string | null>(null);
  readonly turns = signal<CodexTurn[]>([]);
  readonly loading = signal<boolean>(false);
  readonly isStreaming = signal<boolean>(false);
  readonly promptInput = signal<string>('');
  readonly streamError = signal<string | null>(null);
  readonly agents = signal<CodexAgentCatalogItem[]>([]);
  readonly loadingAgents = signal<boolean>(false);
  readonly selectedProvider = signal<string>('codex');
  readonly selectedAgentCode = signal<string>('facebook-agent');
  readonly expandedToolCalls = signal<Record<string, boolean>>({});
  readonly expandedReasoning = signal<Record<string, boolean>>({});
  readonly expandedStderr = signal<Record<string, boolean>>({});
  readonly expandedRequestContext = signal<Record<string, boolean>>({});
  readonly expandedOutputSchema = signal<Record<string, boolean>>({});

  readonly agentOptions = computed<SelectOption[]>(() => {
    const list = this.agents();
    if (list.length === 0) {
      return [{ label: this.selectedAgentCode(), value: this.selectedAgentCode() }];
    }
    return list.map((agent) => ({
      label: `${agent.displayName || agent.agentCode} (${agent.agentCode})`,
      value: agent.agentCode,
    }));
  });

  readonly providerOptions = computed<SelectOption[]>(() => {
    const currentCode = this.selectedAgentCode();
    const currentAgent = this.agents().find((a) => a.agentCode === currentCode);
    if (currentAgent?.supportedProviders && currentAgent.supportedProviders.length > 0) {
      return currentAgent.supportedProviders.map((p) => ({
        label: p.provider === 'codex' ? 'Codex CLI' : p.provider === 'claude' ? 'Claude Code' : p.provider,
        value: p.provider,
        disabled: !p.available,
      }));
    }
    return [
      { label: 'Codex CLI', value: 'codex' },
      { label: 'Claude Code', value: 'claude' },
    ];
  });

  @Input() set show(val: boolean) {
    this.visible.set(val);
  }

  @Input() set selectedThreadId(id: string | null) {
    this.threadId.set(id);
    if (id) {
      this.loadHistory(id);
    } else {
      this.turns.set([]);
    }
  }

  @Output() closed = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<void>();

  private activeAbortController: AbortController | null = null;
  private userScrolledUp = false;
  private lastSentPrompt = '';

  readonly drawerConfig: DrawerConfig = {
    title: 'codexSdk.workbench.title',
    size: 'comfortable',
    side: 'right',
    closeOnBackdrop: true,
    closeOnEsc: true,
  };

  ngOnInit(): void {
    this.fetchAgents();
  }

  fetchAgents(): void {
    this.loadingAgents.set(true);
    this.codexService.getAgents().subscribe({
      next: (list) => {
        this.loadingAgents.set(false);
        this.agents.set(list || []);
        if (list && list.length > 0) {
          const current = this.selectedAgentCode();
          const match = list.find((a) => a.agentCode === current);
          if (!match) {
            const first = list[0];
            this.selectedAgentCode.set(first.agentCode);
            if (first.defaultProvider) {
              this.selectedProvider.set(first.defaultProvider);
            }
          }
        }
      },
      error: () => {
        this.loadingAgents.set(false);
      },
    });
  }

  onAgentChange(agentCode: string): void {
    this.selectedAgentCode.set(agentCode);
    const agent = this.agents().find((a) => a.agentCode === agentCode);
    if (agent?.defaultProvider) {
      this.selectedProvider.set(agent.defaultProvider);
    } else if (
      agent?.supportedProviders &&
      agent.supportedProviders.length > 0 &&
      !agent.supportedProviders.some((p) => p.provider === this.selectedProvider())
    ) {
      this.selectedProvider.set(agent.supportedProviders[0].provider);
    }
  }

  onProviderChange(provider: string): void {
    this.selectedProvider.set(provider);
  }

  ngOnDestroy(): void {
    this.cleanupStream();
  }

  handleClose(): void {
    this.cleanupStream();
    this.visible.set(false);
    this.closed.emit();
  }

  loadHistory(id: string): void {
    this.cleanupStream();
    this.loading.set(true);
    this.codexService.getThreadHistory(id).subscribe({
      next: (detail: CodexThreadDetail) => {
        const rawTurns = detail.turns || [];
        const parsedTurns: CodexTurn[] = rawTurns.map((turn) => {
          if (turn.role !== 'assistant' || !turn.content) {
            return turn;
          }

          let cleanContent = '';
          let reasoning = turn.reasoning || '';
          const stderrLog = turn.stderrLog ? [...turn.stderrLog] : [];
          let preflight = turn.preflight;

          this.codexService.processRawCodexLines(
            turn.content,
            (token) => {
              cleanContent += token;
            },
            (r) => {
              reasoning += r;
            },
            (p) => {
              preflight = p;
            },
            (err) => {
              stderrLog.push(err);
            }
          );

          return {
            ...turn,
            content: cleanContent || turn.content,
            reasoning: reasoning || undefined,
            stderrLog: stderrLog.length > 0 ? stderrLog : undefined,
            preflight: preflight || turn.preflight,
          };
        });

        this.turns.set(parsedTurns);
        this.loading.set(false);
        this.scrollBottomSoon();

        const activeStreamingTurn = parsedTurns.find(
          (t) => t.role === 'assistant' && t.status === 'streaming'
        );
        if (activeStreamingTurn) {
          this.attachLiveStream(id, activeStreamingTurn.id);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  attachLiveStream(threadId: string, assistantTurnId: string): void {
    this.cleanupStream();
    this.isStreaming.set(true);
    this.userScrolledUp = false;

    this.turns.update((turns) =>
      turns.map((t) =>
        t.id === assistantTurnId
          ? {
              ...t,
              content: '',
              reasoning: undefined,
              stderrLog: undefined,
              status: 'streaming',
            }
          : t
      )
    );

    this.activeAbortController = this.codexService.streamLiveThread(
      threadId,
      (token: string) => {
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, content: t.content + token } : t))
        );
        if (!this.userScrolledUp) {
          this.scrollBottomSoon();
        }
      },
      (err: unknown) => {
        this.isStreaming.set(false);
        const message =
          (err as { message?: string })?.message || 'Lỗi kết nối SSE live stream.';
        this.streamError.set(message);
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, status: 'failed' } : t))
        );
      },
      () => {
        this.isStreaming.set(false);
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, status: 'completed' } : t))
        );
        this.messageSent.emit();
      },
      (preflight: any) => {
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, preflight } : t))
        );
      },
      (reasoning: string) => {
        this.turns.update((turns) =>
          turns.map((t) =>
            t.id === assistantTurnId
              ? { ...t, reasoning: (t.reasoning || '') + reasoning }
              : t
          )
        );
        if (!this.userScrolledUp) {
          this.scrollBottomSoon();
        }
      },
      (stderr: string) => {
        this.turns.update((turns) =>
          turns.map((t) =>
            t.id === assistantTurnId
              ? { ...t, stderrLog: [...(t.stderrLog || []), stderr] }
              : t
          )
        );
      }
    );
  }

  onContainerScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    this.userScrolledUp = distanceToBottom > 80;
  }

  toggleToolCall(turnId: string, index: number): void {
    const key = `${turnId}_${index}`;
    this.expandedToolCalls.update((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  isToolCallExpanded(turnId: string, index: number): boolean {
    return !!this.expandedToolCalls()[`${turnId}_${index}`];
  }

  toggleReasoning(turnId: string): void {
    this.expandedReasoning.update((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  }

  isReasoningExpanded(turnId: string): boolean {
    return !!this.expandedReasoning()[turnId];
  }

  toggleStderr(turnId: string): void {
    this.expandedStderr.update((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  }

  isStderrExpanded(turnId: string): boolean {
    return !!this.expandedStderr()[turnId];
  }

  toggleRequestContext(turnId: string): void {
    this.expandedRequestContext.update((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  }

  isRequestContextExpanded(turnId: string): boolean {
    return !!this.expandedRequestContext()[turnId];
  }

  toggleOutputSchema(turnId: string): void {
    this.expandedOutputSchema.update((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  }

  isOutputSchemaExpanded(turnId: string): boolean {
    return !!this.expandedOutputSchema()[turnId];
  }

  formatJson(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  }

  hasKeys(value: unknown): boolean {
    return !!value && typeof value === 'object' && Object.keys(value).length > 0;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.promptInput.set(target.value);
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendPrompt();
    }
  }

  handleFormSubmit(event: Event): void {
    event.preventDefault();
    this.sendPrompt();
  }

  sendPrompt(): void {
    const prompt = this.promptInput().trim();
    if (!prompt || this.isStreaming()) {
      return;
    }

    this.lastSentPrompt = prompt;
    this.streamError.set(null);
    this.promptInput.set('');

    const userTurn: CodexTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    const assistantTurnId = `turn-asst-${Date.now()}`;
    const assistantTurn: CodexTurn = {
      id: assistantTurnId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      toolCalls: [],
      status: 'streaming',
    };

    this.turns.update((turns) => [...turns, userTurn, assistantTurn]);
    this.isStreaming.set(true);
    this.userScrolledUp = false;
    this.scrollBottomSoon();

    const request: CodexPromptRequest = {
      prompt,
      threadId: this.threadId(),
      provider: this.selectedProvider(),
      agentCode: this.selectedAgentCode(),
      stream: true,
    };

    this.activeAbortController = this.codexService.streamPrompt(
      request,
      (token: string) => {
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, content: t.content + token } : t))
        );
        if (!this.userScrolledUp) {
          this.scrollBottomSoon();
        }
      },
      (err: unknown) => {
        this.isStreaming.set(false);
        const message =
          (err as { message?: string })?.message || 'Lỗi truyền nhận SSE stream tới gateway.';
        this.streamError.set(message);
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, status: 'failed' } : t))
        );
      },
      (detectedTaskId?: string) => {
        this.isStreaming.set(false);
        if (detectedTaskId && !this.threadId()) {
          this.threadId.set(detectedTaskId);
        }
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, status: 'completed' } : t))
        );
        this.messageSent.emit();
      },
      (toolCall: unknown) => {
        const item: CodexToolCall =
          typeof toolCall === 'object' && toolCall !== null
            ? (toolCall as CodexToolCall)
            : { name: 'tool_operation', input: toolCall };
        this.turns.update((turns) =>
          turns.map((t) =>
            t.id === assistantTurnId ? { ...t, toolCalls: [...(t.toolCalls || []), item] } : t
          )
        );
      },
      (preflight: any) => {
        this.turns.update((turns) =>
          turns.map((t) => (t.id === assistantTurnId ? { ...t, preflight } : t))
        );
      },
      (reasoning: string) => {
        this.turns.update((turns) =>
          turns.map((t) =>
            t.id === assistantTurnId
              ? { ...t, reasoning: (t.reasoning || '') + reasoning }
              : t
          )
        );
        if (!this.userScrolledUp) {
          this.scrollBottomSoon();
        }
      },
      (stderr: string) => {
        this.turns.update((turns) =>
          turns.map((t) =>
            t.id === assistantTurnId
              ? { ...t, stderrLog: [...(t.stderrLog || []), stderr] }
              : t
          )
        );
      },
      (taskId: string) => {
        if (taskId && !this.threadId()) {
          this.threadId.set(taskId);
        }
      }
    );
  }

  stopStream(): void {
    this.cleanupStream();
    this.isStreaming.set(false);
    this.turns.update((turns) =>
      turns.map((t) => (t.status === 'streaming' ? { ...t, status: 'completed' } : t))
    );
  }

  retryLastPrompt(): void {
    if (this.lastSentPrompt) {
      this.promptInput.set(this.lastSentPrompt);
      this.sendPrompt();
    }
  }

  private cleanupStream(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  private scrollBottomSoon(): void {
    setTimeout(() => {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 10);
  }
}
