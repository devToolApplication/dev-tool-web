import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BaseResponse } from '@core/http/base-response.model';
import { environment } from '../../../../enviroment/environment';
import { WorkflowApiService } from './workflow-api.service';
import { WorkflowDetailDto, WorkflowDefinitionDto, WorkflowRunDto } from '../model/workflow-studio.dto';

describe('WorkflowApiService', () => {
  let service: WorkflowApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WorkflowApiService,
      ],
    });

    service = TestBed.inject(WorkflowApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads AI agent catalog from the admin agent endpoint', () => {
    service.getAgents().subscribe((agents) => {
      expect(agents).toEqual([
        {
          agentCode: 'koc-rule-evaluator',
          displayName: 'KOC Rule Evaluator',
          defaultProvider: 'codex',
          supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
          requiredDependencies: [],
          health: 'HEALTHY',
        },
      ]);
    });

    const request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/ai-agents`);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [
        {
          agentCode: 'koc-rule-evaluator',
          displayName: 'KOC Rule Evaluator',
          defaultProvider: 'codex',
          supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
          requiredDependencies: [],
          health: 'HEALTHY',
        },
      ],
    });
  });

  it('loads AI gate output schemas from the admin schema endpoint', () => {
    service.getAiGateOutputSchemas().subscribe((schemas) => {
      expect(schemas).toEqual([
        {
          value: 'gate-result-v1',
          label: 'Gate result v1',
          description: 'Standard PASS/FAIL/BLOCKED gate output.',
          isDefault: true,
        },
      ]);
    });

    const request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/ai-gate-output-schemas`);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: [
        {
          value: 'gate-result-v1',
          label: 'Gate result v1',
          description: 'Standard PASS/FAIL/BLOCKED gate output.',
          isDefault: true,
        },
      ],
    });
  });

  it('loads workflow page from the admin workflow endpoint', () => {
    const response: BaseResponse<{ data: WorkflowDefinitionDto[]; metadata: { totalElements: number } }> = {
      data: {
        data: [
          {
            id: 'wf-1',
            name: 'KOC screening',
            description: 'Screen KOC profiles',
            status: 'DRAFT',
            currentDraftVersionId: 'ver-1',
            currentPublishedVersionId: null,
          },
        ],
        metadata: { totalElements: 1 },
      },
    };

    service.getWorkflowPage({ page: 1, size: 20, sort: ['name,asc'] }).subscribe((page) => {
      expect(page.data[0].name).toBe('KOC screening');
      expect(page.metadata?.totalElements).toBe(1);
    });

    const request = httpMock.expectOne(
      `${environment.apiUrl.adminAiGenerator}/workflows/page?page=1&size=20&sort=name,asc`,
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('loads workflow detail, run page and run detail from admin endpoints', () => {
    const detail: WorkflowDetailDto = {
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: null,
        status: 'ACTIVE',
        currentDraftVersionId: 'ver-2',
        currentPublishedVersionId: 'ver-1',
      },
      versions: [],
    };
    const run: WorkflowRunDto = {
      id: 'run-1',
      workflowDefinitionId: 'wf-1',
      workflowVersionId: 'ver-1',
      status: 'RUNNING',
      input: {},
      startedAt: '2026-08-22T00:00:00Z',
      completedAt: null,
      finalOutcome: null,
      finalOutput: null,
      nodes: [],
    };
    const runPage: BaseResponse<{ data: WorkflowRunDto[]; metadata: { totalElements: number } }> = {
      data: {
        data: [run],
        metadata: { totalElements: 1 },
      },
    };

    service.getWorkflowDetail('wf-1').subscribe((item) => expect(item.definition.id).toBe('wf-1'));
    let request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/wf-1`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: detail });

    service.getRunPage({ page: 0, size: 10, workflowId: 'wf-1', status: 'RUNNING' }).subscribe((page) => expect(page.data[0].id).toBe('run-1'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/runs/page?page=0&size=10&workflowId=wf-1&status=RUNNING`);
    expect(request.request.method).toBe('GET');
    request.flush(runPage);

    service.getRun('run-1').subscribe((item) => expect(item.status).toBe('RUNNING'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/runs/run-1`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: run });
  });

  it('creates, validates, updates, publishes, starts and retries workflows through ai-agent-mcrs admin APIs', () => {
    const detail: WorkflowDetailDto = {
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: null,
        status: 'DRAFT',
        currentDraftVersionId: 'ver-1',
        currentPublishedVersionId: null,
      },
      versions: [],
    };
    const run: WorkflowRunDto = {
      id: 'run-1',
      workflowDefinitionId: 'wf-1',
      workflowVersionId: 'ver-1',
      status: 'PENDING',
      input: { profile: { id: 'koc-1' } },
      startedAt: '2026-08-22T00:00:00Z',
      completedAt: null,
      finalOutcome: null,
      finalOutput: null,
      nodes: [],
    };
    const payload = {
      name: 'KOC screening',
      description: null,
      definition: { nodes: [{ id: 'start', type: 'START' as const }], edges: [] },
      runtime: { maxParallel: 1 },
      editor: {
        viewport: { x: 1, y: 2, zoom: 0.9 },
        nodes: { start: { x: 10, y: 20 } },
      },
    };

    service.createWorkflow(payload).subscribe((item) => expect(item.definition.id).toBe('wf-1'));
    let request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ data: detail });

    service.validateWorkflow(payload).subscribe((result) => {
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toMatchObject({
        code: 'BACKEND_VALIDATION_ERROR',
        severity: 'error',
        message: 'workflow must have at least one END',
      });
    });
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/validate`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      data: {
        valid: false,
        issues: [
          {
            code: 'BACKEND_VALIDATION_ERROR',
            severity: 'ERROR',
            message: 'workflow must have at least one END',
          },
        ],
      },
    });

    service.updateWorkflow('wf-1', payload).subscribe((item) => expect(item.definition.id).toBe('wf-1'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/wf-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ data: detail });

    service.publishWorkflow('wf-1').subscribe((item) => expect(item.definition.id).toBe('wf-1'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/wf-1/publish`);
    expect(request.request.method).toBe('POST');
    request.flush({ data: detail });

    service.startWorkflow('wf-1', { profile: { id: 'koc-1' } }).subscribe((item) => expect(item.id).toBe('run-1'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/wf-1/start`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ input: { profile: { id: 'koc-1' } } });
    request.flush({ data: run });

    service.retryRun('run-1').subscribe((item) => expect(item.id).toBe('run-1'));
    request = httpMock.expectOne(`${environment.apiUrl.adminAiGenerator}/workflows/runs/run-1/retry`);
    expect(request.request.method).toBe('POST');
    request.flush({ data: run });
  });
});
