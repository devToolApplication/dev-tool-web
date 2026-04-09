import { Component, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  PlaywrightCdpConnectResponse,
  PlaywrightLangChain4jTestRequest,
  PlaywrightLangChain4jTestResponse,
  PlaywrightOpenAiChatCompletionRequest,
  PlaywrightOpenAiChatCompletionResponse
} from '../../../../../core/models/ai-agent/playwright.model';
import { PlaywrightAdminService } from '../../../../../core/services/ai-agent-service/playwright-admin.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';

type AskTab = 'chatgpt' | 'langchain4j';

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

  readonly activeTab = signal<AskTab>('chatgpt');
  readonly formVisible = signal(true);

  readonly chatGptFormConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'cdpUrl',
        label: 'CDP URL',
        width: 'full',
        placeholder: 'http://127.0.0.1:9222'
      },
      {
        type: 'text',
        name: 'model',
        label: 'Model',
        width: 'full',
        placeholder: 'gpt-5-mini'
      },
      {
        type: 'textarea',
        name: 'systemPrompt',
        label: 'System Prompt',
        width: 'full',
        rows: 4
      },
      {
        type: 'textarea',
        name: 'userPrompt',
        label: 'User Prompt',
        width: 'full',
        rows: 8,
        validation: [Rules.required('User prompt is required')]
      },
      {
        type: 'checkbox',
        name: 'clearBeforeType',
        label: 'Xoa noi dung cu truoc khi nhap',
        width: 'full'
      }
    ]
  };

  readonly langChain4jFormConfig: FormConfig = {
    fields: [
      {
        type: 'text',
        name: 'model',
        label: 'AI Model',
        width: 'full',
        placeholder: 'gpt-oss-120b'
      },
      {
        type: 'textarea',
        name: 'prompt',
        label: 'LangChain4j Prompt',
        width: 'full',
        rows: 8,
        validation: [Rules.required('Prompt is required')]
      }
    ]
  };

  checkingConnection = false;
  submittingChatGpt = false;
  submittingLangChain4j = false;

  chatGptFormValue: {
    cdpUrl: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    clearBeforeType: boolean;
  } = {
    cdpUrl: '',
    model: 'gpt-5-mini',
    systemPrompt: '',
    userPrompt: '',
    clearBeforeType: true
  };

  langChain4jFormValue: PlaywrightLangChain4jTestRequest = {
    model: 'gpt-oss-120b',
    prompt: ''
  };

  connectionResult: PlaywrightCdpConnectResponse | null = null;
  chatGptResult: PlaywrightOpenAiChatCompletionResponse | null = null;
  langChain4jResult: PlaywrightLangChain4jTestResponse | null = null;

  constructor(
    private readonly playwrightAdminService: PlaywrightAdminService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  setActiveTab(tab: AskTab): void {
    this.activeTab.set(tab);
  }

  onTabChange(value: string | number | undefined): void {
    if (value === 'chatgpt' || value === 'langchain4j') {
      this.setActiveTab(value);
    }
  }

  onCheckConnection(): void {
    const cdpUrl = this.chatGptFormValue.cdpUrl || '';
    this.checkingConnection = true;
    this.loadingService
      .track(this.playwrightAdminService.checkCdp({ cdpUrl: this.normalizeOptional(cdpUrl) }))
      .pipe(finalize(() => (this.checkingConnection = false)))
      .subscribe({
        next: (response: PlaywrightCdpConnectResponse) => {
          this.connectionResult = response;
          if (response.connected) {
            this.toastService.info('CDP connected');
            return;
          }
          this.toastService.error(response.errorMessage || 'CDP check failed');
        },
        error: () => this.toastService.error('CDP check failed')
      });
  }

  onChatGptValueChange(model: {
    cdpUrl?: string;
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    clearBeforeType?: boolean;
  }): void {
    this.chatGptFormValue = {
      cdpUrl: model?.cdpUrl || '',
      model: model?.model || 'gpt-5-mini',
      systemPrompt: model?.systemPrompt || '',
      userPrompt: model?.userPrompt || '',
      clearBeforeType: model?.clearBeforeType ?? true
    };
  }

  onLangChain4jValueChange(model: PlaywrightLangChain4jTestRequest): void {
    this.langChain4jFormValue = {
      model: model?.model || 'gpt-oss-120b',
      prompt: model?.prompt || ''
    };
  }

  onSubmitChatGpt(model: {
    cdpUrl?: string;
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
    clearBeforeType?: boolean;
  }): void {
    const systemPrompt = (model?.systemPrompt || '').trim();
    const userPrompt = (model?.userPrompt || '').trim();
    const payload: PlaywrightOpenAiChatCompletionRequest = {
      cdpUrl: this.normalizeOptional(model?.cdpUrl || ''),
      model: this.normalizeOptional(model?.model || ''),
      clearBeforeType: model?.clearBeforeType ?? true,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    };

    this.submittingChatGpt = true;
    this.langChain4jResult = null;
    this.loadingService
      .track(this.playwrightAdminService.chatCompletions(payload))
      .pipe(finalize(() => (this.submittingChatGpt = false)))
      .subscribe({
        next: (response: PlaywrightOpenAiChatCompletionResponse) => {
          this.chatGptResult = response;
          this.toastService.info('Chat completion success');
        },
        error: () => this.toastService.error('Chat completion failed')
      });
  }

  onSubmitLangChain4j(model: PlaywrightLangChain4jTestRequest): void {
    const payload: PlaywrightLangChain4jTestRequest = {
      model: this.normalizeOptional(model?.model || '') || 'gpt-oss-120b',
      prompt: (model?.prompt || '').trim()
    };

    this.submittingLangChain4j = true;
    this.chatGptResult = null;
    this.loadingService
      .track(this.playwrightAdminService.langChain4jTest(payload))
      .pipe(finalize(() => (this.submittingLangChain4j = false)))
      .subscribe({
        next: (response: PlaywrightLangChain4jTestResponse) => {
          this.langChain4jResult = response;
          this.toastService.info('LangChain4j test success');
        },
        error: () => this.toastService.error('LangChain4j test failed')
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
