import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../enviroment/environment';
import { SdkAdminApiService } from './sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkAgentHealthResponse,
  SdkServiceHealthResponse,
  SdkTaskExecuteRequest,
  SdkTaskRunDetail,
  SdkTaskRunListResponse,
  SdkTaskRunSummary,
} from '../model/sdk-management.model';

describe('SdkAdminApiService', () => {
  let service: SdkAdminApiService;
  let httpTesting: HttpTestingController;
  const adminBaseUrl = environment.apiUrl.adminAiGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SdkAdminApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SdkAdminApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list agents from admin catalog endpoint', () => {
    const mockAgents: SdkAgentCatalogItem[] = [
      {
        agentCode: 'ba-agent',
        displayName: 'Business Analyst',
        defaultProvider: 'codex',
        supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
        requiredDependencies: ['mcp-server-git'],
        health: 'HEALTHY',
      },
    ];

    service.listAgents().subscribe((data) => {
      expect(data).toEqual(mockAgents);
    });

    const req = httpTesting.expectOne(`${adminBaseUrl}/ai-agents`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockAgents });
  });

  it('should check agent health with optional query params', () => {
    const mockHealth: SdkAgentHealthResponse = {
      agentCode: 'ba-agent',
      provider: 'codex',
      status: 'READY',
      mcp: [
        {
          name: 'git-server',
          status: 'UP',
          configured: true,
          required: true,
          requiredTools: ['git_status'],
          missingTools: [],
          toolCount: 5,
          latencyMs: 12,
        },
      ],
    };

    service.checkAgentHealth('ba-agent', 'codex', '/workdir').subscribe((data) => {
      expect(data).toEqual(mockHealth);
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${adminBaseUrl}/ai-agents/ba-agent/health` &&
        r.params.get('provider') === 'codex' &&
        r.params.get('workingDirectory') === '/workdir'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockHealth });
  });

  it('should get service health', () => {
    const mockServiceHealth: SdkServiceHealthResponse = {
      status: 'UP',
      service: 'codex-sdk-api',
      auth: { ok: true },
      codex: { ok: true },
      database: { ok: true },
    };

    service.getServiceHealth().subscribe((data) => {
      expect(data).toEqual(mockServiceHealth);
    });

    const req = httpTesting.expectOne(`${adminBaseUrl}/sdk/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockServiceHealth });
  });

  it('should execute task and return run summary', () => {
    const payload: SdkTaskExecuteRequest = {
      agentCode: 'ba-agent',
      provider: 'codex',
      prompt: 'Write requirements',
    };
    const mockSummary: SdkTaskRunSummary = {
      taskId: 'task-123',
      agentCode: 'ba-agent',
      provider: 'codex',
      status: 'RUNNING',
      promptPreview: 'Write requirements',
      createdAt: '2026-09-03T00:00:00Z',
      updatedAt: '2026-09-03T00:00:00Z',
    };

    service.executeTask(payload).subscribe((data) => {
      expect(data).toEqual(mockSummary);
    });

    const req = httpTesting.expectOne(`${adminBaseUrl}/sdk/tasks/runs`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: mockSummary });
  });

  it('should list task runs with filters', () => {
    const mockResponse: SdkTaskRunListResponse = {
      items: [],
      page: 1,
      size: 10,
      total: 0,
    };

    service.listTaskRuns({ page: 1, size: 10, agentCode: 'ba-agent' }).subscribe((data) => {
      expect(data).toEqual(mockResponse);
    });

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${adminBaseUrl}/sdk/tasks/runs` &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10' &&
        r.params.get('agentCode') === 'ba-agent'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockResponse });
  });

  it('should get task run detail', () => {
    const mockDetail: SdkTaskRunDetail = {
      taskId: 'task-123',
      agentCode: 'ba-agent',
      provider: 'codex',
      status: 'COMPLETED',
      promptPreview: 'Write requirements',
      createdAt: '2026-09-03T00:00:00Z',
      updatedAt: '2026-09-03T00:01:00Z',
      events: [],
    };

    service.getTaskRunDetail('task-123').subscribe((data) => {
      expect(data).toEqual(mockDetail);
    });

    const req = httpTesting.expectOne(`${adminBaseUrl}/sdk/tasks/runs/task-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockDetail });
  });
});