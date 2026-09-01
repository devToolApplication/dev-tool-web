import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SdkTaskApiService } from '../../api/sdk-task-api.service';
import type { SdkTaskRunDetail, SdkTaskRunSummary } from '../../model/sdk-task.model';
import {
  SdkTaskConsoleComponent,
  buildSdkTaskRunRequest,
  parseSdkTaskQuery,
  serializeSdkTaskQuery,
} from './sdk-task-console.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('SdkTaskConsoleComponent', () => {
  let fixture: ComponentFixture<SdkTaskConsoleComponent>;
  let component: SdkTaskConsoleComponent;
  let api: {
    startRun: ReturnType<typeof vi.fn>;
    listRuns: ReturnType<typeof vi.fn>;
    getRun: ReturnType<typeof vi.fn>;
  };

  const sampleSummary: SdkTaskRunSummary = {
    taskId: 'task-1',
    status: 'RUNNING',
    agentCode: 'dev-fe-agent',
    provider: 'codex',
    promptPreview: 'run prompt',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const runningDetail: SdkTaskRunDetail = {
    ...sampleSummary,
    request: {
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      model: 'gpt-5.2',
      callbackAuthSecretConfigured: true,
    },
    events: [{ sequence: 1, at: '2026-09-01T00:00:00Z', type: 'accepted' }],
  };

  beforeEach(() => {
    api = {
      startRun: vi.fn(() => of(sampleSummary)),
      listRuns: vi.fn(() => of({ items: [sampleSummary], page: 1, size: 20, total: 1 })),
      getRun: vi.fn(() => of(runningDetail)),
    };
    const router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [SdkTaskConsoleComponent, TranslateContentPipeStub],
      providers: [
        { provide: SdkTaskApiService, useValue: api },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ page: '2', size: '10', status: 'RUNNING' }),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(SdkTaskConsoleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('builds full SDK task request and validates required/json fields', () => {
    expect(
      buildSdkTaskRunRequest({
        agentCode: '',
        provider: 'codex',
        prompt: '',
        threadId: '',
        workingDirectory: '',
        model: '',
        reasoningEffort: '',
        outputSchemaText: '',
        requestContextText: '',
        callbackUrl: '',
        callbackAuthSecretCode: '',
      }),
    ).toEqual({ errorKey: 'systemManagement.sdkTask.validation.required' });

    const invalidJson = buildSdkTaskRunRequest({
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      threadId: '',
      workingDirectory: '',
      model: '',
      reasoningEffort: '',
      outputSchemaText: '[1, 2, 3]',
      requestContextText: '',
      callbackUrl: '',
      callbackAuthSecretCode: '',
    });
    expect(invalidJson.errorKey).toBe('systemManagement.sdkTask.validation.jsonObject');

    const valid = buildSdkTaskRunRequest({
      agentCode: ' dev-fe-agent ',
      provider: 'codex',
      prompt: ' run prompt ',
      threadId: ' thread-1 ',
      workingDirectory: ' D:/Code/web/dev-tool-web ',
      model: ' gpt-5.2 ',
      reasoningEffort: ' medium ',
      outputSchemaText: '{"type":"object"}',
      requestContextText: '{"screen":"sdk"}',
      callbackUrl: ' https://callback.internal ',
      callbackAuthSecretCode: ' secret-code ',
    });

    expect(valid.payload).toEqual({
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      threadId: 'thread-1',
      workingDirectory: 'D:/Code/web/dev-tool-web',
      model: 'gpt-5.2',
      reasoningEffort: 'medium',
      outputSchema: { type: 'object' },
      requestContext: { screen: 'sdk' },
      callbackUrl: 'https://callback.internal',
      callbackAuthSecretCode: 'secret-code',
    });
  });

  it('maps route query params both directions', () => {
    const parsed = parseSdkTaskQuery(
      convertToParamMap({
        page: '3',
        size: '50',
        status: 'COMPLETED',
        provider: 'codex',
        agentCode: 'dev-be-agent',
        threadId: 'thread-1',
        createdFrom: '2026-09-01',
        createdTo: '2026-09-02',
      }),
    );

    expect(parsed).toEqual({
      page: 3,
      size: 50,
      status: 'COMPLETED',
      provider: 'codex',
      agentCode: 'dev-be-agent',
      threadId: 'thread-1',
      createdFrom: '2026-09-01',
      createdTo: '2026-09-02',
    });
    expect(serializeSdkTaskQuery(parsed)).toEqual({
      page: 3,
      size: 50,
      status: 'COMPLETED',
      provider: 'codex',
      agentCode: 'dev-be-agent',
      threadId: 'thread-1',
      createdFrom: '2026-09-01',
      createdTo: '2026-09-02',
    });
  });

  it('submits form, refreshes history, and selects created run detail', async () => {
    component.form.set({
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      threadId: '',
      workingDirectory: '',
      model: 'gpt-5.2',
      reasoningEffort: 'medium',
      outputSchemaText: '',
      requestContextText: '',
      callbackUrl: '',
      callbackAuthSecretCode: '',
    });

    await component.runPrompt();

    expect(api.startRun).toHaveBeenCalledWith({
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      model: 'gpt-5.2',
      reasoningEffort: 'medium',
    });
    expect(api.listRuns).toHaveBeenCalledWith({ page: 1, size: 20 });
    expect(api.getRun).toHaveBeenCalledWith('task-1');
    expect(component.selectedRunDetail()?.taskId).toBe('task-1');
  });

  it('polls running detail and stops after terminal status', async () => {
    vi.useFakeTimers();
    try {
      api.getRun = vi
        .fn()
        .mockReturnValueOnce(of(runningDetail))
        .mockReturnValueOnce(of({ ...runningDetail, status: 'COMPLETED' } satisfies SdkTaskRunDetail));

      await component.loadRunDetail('task-1');
      expect(component.polling()).toBe(true);

      await vi.advanceTimersByTimeAsync(5000);

      expect(api.getRun).toHaveBeenCalledTimes(2);
      expect(component.selectedRunDetail()?.status).toBe('COMPLETED');
      expect(component.polling()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps recoverable history errors visible', async () => {
    api.listRuns.mockReturnValueOnce(throwError(() => new Error('Server error')));

    await component.loadRuns();

    expect(component.error()).toBe('Server error');
    expect(component.loadingRuns()).toBe(false);
  });
});
