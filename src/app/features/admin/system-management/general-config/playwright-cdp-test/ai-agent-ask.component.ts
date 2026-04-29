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
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

@Component({
  selector: 'app-ai-agent-ask',
  standalone: false,
  templateUrl: './ai-agent-ask.component.html',
  styleUrl: './ai-agent-ask.component.css'
})
export class AiAgentAskComponent {
  readonly formContext: FormContext = {
    user: null,
    mode: 'create'
  };

  readonly formVisible = signal(true);

  readonly chatGptFormConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'model',
        label: 'aiAgent.model',
        width: 'full',
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
}
