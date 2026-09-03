import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { SelectOption } from '@shared/ui/primitives/select/select';
import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkAgentProvider,
  SdkTaskExecuteRequest,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';

export interface SdkExecuteFormState {
  agentCode: string;
  provider: SdkAgentProvider;
  prompt: string;
  threadId: string;
  workingDirectory: string;
  model: string;
  reasoningEffort: string;
  outputSchemaText: string;
  requestContextText: string;
  callbackUrl: string;
  callbackAuthSecretCode: string;
}

const EMPTY_FORM: SdkExecuteFormState = {
  agentCode: '',
  provider: 'codex',
  prompt: '',
  threadId: '',
  workingDirectory: '',
  model: 'gpt-5.2',
  reasoningEffort: 'medium',
  outputSchemaText: '',
  requestContextText: '',
  callbackUrl: '',
  callbackAuthSecretCode: '',
};

@Component({
  selector: 'app-sdk-execute-tab',
  standalone: false,
  templateUrl: './sdk-execute-tab.component.html',
  styleUrl: './sdk-execute-tab.component.css',
})
export class SdkExecuteTabComponent implements OnInit {
  @Input() agents: SdkAgentCatalogItem[] = [];
  @Input() set prefilledAgentCode(code: string | null) {
    if (code) {
      this.form.update((f) => ({ ...f, agentCode: code }));
    }
  }
  @Output() taskExecuted = new EventEmitter<SdkTaskRunSummary>();

  readonly form = signal<SdkExecuteFormState>({ ...EMPTY_FORM });
  readonly isSubmitting = signal<boolean>(false);
  readonly executionResult = signal<SdkTaskRunSummary | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly providerOptions: SelectOption<string>[] = [
    { label: 'Codex', value: 'codex' },
    { label: 'Claude', value: 'claude' },
  ];

  constructor(private readonly api: SdkAdminApiService) {}

  ngOnInit(): void {
    if (!this.form().agentCode && this.agents.length > 0) {
      this.form.update((f) => ({ ...f, agentCode: this.agents[0].agentCode }));
    }
  }

  get agentOptions(): SelectOption<string>[] {
    return this.agents.map((a) => ({
      label: `${a.displayName} (${a.agentCode})`,
      value: a.agentCode,
    }));
  }

  onFieldChange(field: keyof SdkExecuteFormState, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  onLoadSample(): void {
    this.form.update((f) => ({
      ...f,
      prompt: 'Summarize candidate profile and verify background checks.',
      outputSchemaText: JSON.stringify(
        {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            passed: { type: 'boolean' },
          },
          required: ['summary', 'passed'],
        },
        null,
        2
      ),
      requestContextText: JSON.stringify(
        {
          campaignId: 'camp-100',
          reviewer: 'admin-user',
        },
        null,
        2
      ),
    }));
  }

  onReset(): void {
    this.form.set({ ...EMPTY_FORM });
    this.executionResult.set(null);
    this.errorMessage.set(null);
  }

  async onSubmit(): Promise<void> {
    const current = this.form();
    if (!current.agentCode.trim() || !current.prompt.trim()) {
      this.errorMessage.set('Agent code and prompt are required.');
      return;
    }

    let outputSchema: Record<string, unknown> | undefined;
    let requestContext: Record<string, unknown> | undefined;

    try {
      if (current.outputSchemaText.trim()) {
        outputSchema = JSON.parse(current.outputSchemaText);
      }
    } catch {
      this.errorMessage.set('Output Schema must be valid JSON.');
      return;
    }

    try {
      if (current.requestContextText.trim()) {
        requestContext = JSON.parse(current.requestContextText);
      }
    } catch {
      this.errorMessage.set('Request Context must be valid JSON.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: SdkTaskExecuteRequest = {
      agentCode: current.agentCode,
      provider: current.provider,
      prompt: current.prompt,
      threadId: current.threadId || undefined,
      workingDirectory: current.workingDirectory || undefined,
      model: current.model || undefined,
      reasoningEffort: current.reasoningEffort || undefined,
      outputSchema,
      requestContext,
      callbackUrl: current.callbackUrl || undefined,
      callbackAuthSecretCode: current.callbackAuthSecretCode || undefined,
    };

    try {
      const summary = await firstValueFrom(this.api.executeTask(payload));
      this.executionResult.set(summary);
      this.taskExecuted.emit(summary);
    } catch {
      this.errorMessage.set('Failed to execute AI task.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}