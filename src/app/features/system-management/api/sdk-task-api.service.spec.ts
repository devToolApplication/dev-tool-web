import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import type {
  SdkTaskRunDetail,
  SdkTaskRunListResponse,
  SdkTaskRunRequest,
  SdkTaskRunSummary,
} from '../model/sdk-task.model';
import { SdkTaskApiService } from './sdk-task-api.service';

describe('SdkTaskApiService', () => {
  let service: SdkTaskApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.adminAiGenerator}/sdk/tasks/runs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SdkTaskApiService],
    });

    service = TestBed.inject(SdkTaskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts task run and unwraps BaseResponse data', () => {
    const payload: SdkTaskRunRequest = {
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'run prompt',
      threadId: 't-1',
      workingDirectory: 'D:/Code/web/dev-tool-web',
      model: 'gpt-5.2',
      reasoningEffort: 'medium',
      outputSchema: { type: 'object' },
      requestContext: { feature: 'sdk-console' },
      callbackUrl: 'https://callback.internal',
      callbackAuthSecretCode: 'secret-1',
    };
    const summary: SdkTaskRunSummary = {
      taskId: 'task-1',
      status: 'RUNNING',
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      promptPreview: 'run prompt',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    };

    service.startRun(payload).subscribe((res) => {
      expect(res).toEqual(summary);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: summary, status: 202 } satisfies BaseResponse<SdkTaskRunSummary>);
  });

  it('lists task runs and omits empty query params', () => {
    const listResponse: SdkTaskRunListResponse = {
      items: [],
      page: 2,
      size: 20,
      total: 0,
    };

    service
      .listRuns({
        page: 2,
        size: 20,
        status: 'COMPLETED',
        agentCode: 'dev-fe-agent',
        provider: 'codex',
        threadId: 't-123',
        createdFrom: '2026-09-01',
        createdTo: '2026-09-02',
      })
      .subscribe((res) => {
        expect(res).toEqual(listResponse);
      });

    const expectedUrl =
      `${baseUrl}?page=2&size=20&status=COMPLETED&agentCode=dev-fe-agent` +
      '&provider=codex&threadId=t-123&createdFrom=2026-09-01&createdTo=2026-09-02';
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: listResponse, status: 200 } satisfies BaseResponse<SdkTaskRunListResponse>);

    service.listRuns({ agentCode: '', status: undefined, provider: undefined }).subscribe();
    const cleanReq = httpMock.expectOne(baseUrl);
    expect(cleanReq.request.method).toBe('GET');
    expect(cleanReq.request.params.keys()).toEqual([]);
    cleanReq.flush({ data: listResponse, status: 200 } satisfies BaseResponse<SdkTaskRunListResponse>);
  });

  it('fetches run detail by taskId and unwraps response', () => {
    const detail: SdkTaskRunDetail = {
      taskId: 'task-100',
      status: 'COMPLETED',
      agentCode: 'dev-be-agent',
      provider: 'codex',
      promptPreview: 'execute task',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:01:00Z',
      completedAt: '2026-09-01T00:01:00Z',
      events: [{ sequence: 1, at: '2026-09-01T00:00:00Z', type: 'accepted' }],
    };

    service.getRun('task-100').subscribe((res) => {
      expect(res).toEqual(detail);
    });

    const req = httpMock.expectOne(`${baseUrl}/task-100`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detail, status: 200 } satisfies BaseResponse<SdkTaskRunDetail>);
  });
});
