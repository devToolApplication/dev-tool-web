import { Component, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  PlaywrightCdpConnectResponse,
  PlaywrightOpenAiChatCompletionRequest,
  PlaywrightOpenAiChatCompletionResponse
} from '../../../../../core/models/ai-agent/playwright.model';
import { PlaywrightAdminService } from '../../../../../core/services/ai-agent-service/playwright-admin.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BadgeVariant } from '../../../../../shared/ui/data-display/badge/badge.component';
import { KeyValueItem } from '../../../../../shared/ui/data-display/key-value-list/key-value-list.component';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

const CHAT_GPT_MODEL_OPTIONS = [
  { label: 'gpt-5-mini', value: 'gpt-5-mini' }
];

@Component({
  selector: 'app-ai-agent-ask',
  standalone: false,
  templateUrl: './ai-agent-ask.component.html',
  styleUrl: './ai-agent-ask.component.css'
})
export class AiAgentAskComponent {
  readonly formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      modelOptions: CHAT_GPT_MODEL_OPTIONS
    }
  };

  readonly formVisible = signal(true);

  readonly chatGptFormConfig: FormConfig = {
    fields: [
      {
        type: 'auto-complete',
        name: 'model',
        label: 'aiAgent.model',
        width: 'full',
        optionsExpression: 'context.extra?.modelOptions || []',
        placeholder: 'gpt-5-mini'
      },
      {
        type: 'textarea',
        name: 'systemPrompt',
        label: 'aiAgent.systemPrompt',
        width: 'full',
        rows: 4
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'aiAgent.userPrompt',
        width: 'full',
        rows: 8,
        validation: [Rules.required('aiAgent.validation.userPromptRequired')]
      },
      {
        type: 'checkbox',
        name: 'clearBeforeType',
        label: 'aiAgent.cdpTest.clearBeforeType',
        width: 'full'
      }
    ]
  };

  checkingConnection = false;
  submittingChatGpt = false;

  chatGptFormValue: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    clearBeforeType: boolean;
  } = {
    model: 'gpt-5-mini',
    systemPrompt: '',
    userPrompt: '',
    clearBeforeType: true
  };

  connectionResult: PlaywrightCdpConnectResponse | null = null;
  chatGptResult: PlaywrightOpenAiChatCompletionResponse | null = null;

  constructor(
    private readonly playwrightAdminService: PlaywrightAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  onCheckConnection(): void {
    this.checkingConnection = true;
    this.loadingService
      .track(this.playwrightAdminService.checkCdp())
      .pipe(finalize(() => (this.checkingConnection = false)))
      .subscribe({
        next: (response: PlaywrightCdpConnectResponse) => {
          this.connectionResult = response;
          if (response.connected) {
            this.toastService.info('aiAgent.cdpTest.toast.cdpConnected');
            return;
          }
          this.toastService.error(response.errorMessage || 'aiAgent.cdpTest.toast.cdpCheckFailed');
        },
        error: () => this.toastService.error('aiAgent.cdpTest.toast.cdpCheckFailed')
      });
  }

  get chatGptSummaryItems(): KeyValueItem[] {
    const result = this.chatGptResult;
    if (!result) {
      return [];
    }

    const finishReason = result.choices?.[0]?.finishReason || '';

    return [
      { label: 'id', value: result.id, type: 'copyable' },
      { label: 'aiAgent.model', value: result.model },
      { label: 'aiAgent.created', value: result.created, type: result.created == null ? 'text' : 'number', format: '1.0-0' },
      { label: 'aiAgent.object', value: result.object },
      { label: 'aiAgent.finishReason', value: finishReason, type: 'badge', variant: this.finishReasonVariant(finishReason) },
      { label: 'aiAgent.totalTokens', value: result.usage?.totalTokens, type: 'number', format: '1.0-0' }
    ];
  }

  get chatGptToolCallItems(): KeyValueItem[] {
    return this.chatGptResult
      ? [
          {
            label: 'aiAgent.toolCalls',
            value: this.chatGptResult.choices?.[0]?.message?.toolCalls ?? [],
            type: 'json'
          }
        ]
      : [];
  }

  get connectionSummaryItems(): KeyValueItem[] {
    const result = this.connectionResult;
    if (!result) {
      return [];
    }

    return [
      { label: 'aiAgent.cdpTest.browser', value: result.browserVersion },
      { label: 'aiAgent.cdpTest.contexts', value: result.contextCount ?? 0, type: 'number', format: '1.0-0' },
      { label: 'aiAgent.cdpTest.pages', value: result.pageCount ?? 0, type: 'number', format: '1.0-0' }
    ];
  }

  connectionVariant(connected: boolean): BadgeVariant {
    return connected ? 'success' : 'danger';
  }

  onChatGptValueChange(model: {
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    clearBeforeType?: boolean;
  }): void {
    this.chatGptFormValue = {
      model: model?.model || 'gpt-5-mini',
      systemPrompt: model?.systemPrompt || '',
      userPrompt: model?.userPrompt || '',
      clearBeforeType: model?.clearBeforeType ?? true
    };
  }

  onSubmitChatGpt(model: {
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    clearBeforeType?: boolean;
  }): void {
    const systemPrompt = (model?.systemPrompt || '').trim();
    const userPrompt = (model?.userPrompt || '').trim();
    const payload: PlaywrightOpenAiChatCompletionRequest = {
      model: this.normalizeOptional(model?.model || ''),
      clearBeforeType: model?.clearBeforeType ?? true,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    };

    this.submittingChatGpt = true;
    this.loadingService
      .track(this.playwrightAdminService.chatCompletions(payload))
      .pipe(finalize(() => (this.submittingChatGpt = false)))
      .subscribe({
        next: (response: PlaywrightOpenAiChatCompletionResponse) => {
          this.chatGptResult = response;
          this.toastService.info('aiAgent.cdpTest.toast.chatCompletionSuccess');
        },
        error: () => this.toastService.error('aiAgent.cdpTest.toast.chatCompletionFailed')
      });
  }

  onActionClick(actionId: string): void {
    if (actionId === 'check-cdp-chatgpt') {
      this.onCheckConnection();
    }
  }

  private normalizeOptional(value: string): string | undefined {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private finishReasonVariant(reason: string): BadgeVariant {
    switch (reason) {
      case 'stop':
        return 'success';
      case 'tool_calls':
        return 'info';
      case 'length':
        return 'warning';
      default:
        return 'muted';
    }
  }
}
