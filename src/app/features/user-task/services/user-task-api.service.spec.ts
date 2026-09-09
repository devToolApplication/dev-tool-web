import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../enviroment/environment';
import {
  UserTaskActionRequest,
  UserTaskActionResponse,
  UserTaskDetail,
  UserTaskHistoryItem,
  UserTaskSummary,
} from '../models/user-task.model';
import { UserTaskApiService } from './user-task-api.service';

describe('UserTaskApiService', () => {
  let service: UserTaskApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl.aiGenerator}/user-tasks`;

  const mockTaskSummary: UserTaskSummary = {
    taskId: 'task-1',
    processInstanceId: 'pi-1',
    businessKey: 'biz-1',
    formKey: 'KOC_CANDIDATE_APPROVAL',
    taskName: 'Approve KOC',
    processDefinitionName: 'KOC Discovery',
    assignee: 'lamld',
    createdAt: '2026-09-09T00:00:00Z',
    dueAt: '2026-09-10T00:00:00Z',
    priority: 50,
    completed: false,
    claimable: true,
    readOnly: false,
    canAct: true,
    allowedActions: ['APPROVE', 'REJECT'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserTaskApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserTaskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('queries tasks with all filter parameters and unwraps data', () => {
    const mockTasks: UserTaskSummary[] = [mockTaskSummary];

    service
      .getTasks({
        view: 'CLAIMABLE',
        status: 'ACTIVE',
        keyword: 'KOC',
        formKey: 'KOC_CANDIDATE_APPROVAL',
        businessKey: 'biz-1',
        dueAfter: '2026-09-01T00:00:00Z',
        dueBefore: '2026-09-30T00:00:00Z',
        page: 0,
        size: 10,
        sort: 'createdAt,desc',
      })
      .subscribe((result) => {
        expect(result.data).toEqual(mockTasks);
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === baseUrl &&
        request.params.get('view') === 'CLAIMABLE' &&
        request.params.get('status') === 'ACTIVE' &&
        request.params.get('keyword') === 'KOC' &&
        request.params.get('formKey') === 'KOC_CANDIDATE_APPROVAL' &&
        request.params.get('businessKey') === 'biz-1' &&
        request.params.get('dueAfter') === '2026-09-01T00:00:00Z' &&
        request.params.get('dueBefore') === '2026-09-30T00:00:00Z' &&
        !request.params.has('dueFrom') &&
        !request.params.has('dueTo') &&
        request.params.get('page') === '0' &&
        request.params.get('size') === '10' &&
        request.params.get('sort') === 'createdAt,desc',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: mockTasks } });
  });

  it('preserves an exact padded formKey query value', () => {
    service.getTasks({ formKey: ' KOC_CANDIDATE_APPROVAL ' }).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === baseUrl &&
        request.params.get('formKey') === ' KOC_CANDIDATE_APPROVAL ',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: [] } });
  });

  it('fetches task detail by taskId and maps only valid typed content', () => {
    const mockDetail: UserTaskDetail = {
      task: mockTaskSummary,
      supported: true,
      content: {
        campaignId: 'camp-1',
        campaignName: 'Campaign',
        niche: 'Beauty',
        targetCount: 2,
        minScore: 80,
        candidates: [],
        rawProcessSecret: 'must-not-pass-through',
      },
      allowedActions: ['APPROVE', 'REJECT'],
      permission: {
        visible: true,
        claimable: false,
        readOnly: false,
        canAct: true,
      },
    };

    service.getTask('task-1').subscribe((result) => {
      expect(result.content).toEqual({
        campaignId: 'camp-1',
        campaignName: 'Campaign',
        niche: 'Beauty',
        targetCount: 2,
        minScore: 80,
        candidates: [],
      });
      expect(result.content).not.toHaveProperty('rawProcessSecret');
    });

    const req = httpMock.expectOne(`${baseUrl}/task-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockDetail });
  });

  it('fetches task history with BE structured comment fields', () => {
    const mockHistory: UserTaskHistoryItem[] = [
      {
        id: 'h-1',
        taskId: 'task-1',
        processInstanceId: 'pi-1',
        type: 'CLAIM',
        userId: 'lamld',
        time: '2026-09-09T01:00:00Z',
        message: 'Claimed task',
        requestId: 'req-1',
        action: 'CLAIM',
        comment: 'Assigned',
      },
    ];

    service.getTaskHistory('task-1').subscribe((result) => {
      expect(result).toEqual(mockHistory);
    });

    const req = httpMock.expectOne(`${baseUrl}/task-1/history`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockHistory });
  });

  it('claims task without sending assignee in body', () => {
    service.claimTask('task-1').subscribe((result) => {
      expect(result).toEqual(mockTaskSummary);
    });

    const req = httpMock.expectOne(`${baseUrl}/task-1/claim`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ data: mockTaskSummary });
  });

  it('submits action with requestId, action, variables and comment', () => {
    const actionReq: UserTaskActionRequest = {
      requestId: 'req-123',
      action: 'APPROVE',
      variables: { approvedCandidateIds: ['cand-1'] },
      comment: 'Approved',
    };

    const actionRes: UserTaskActionResponse = {
      taskId: 'task-1',
      requestId: 'req-123',
      action: 'APPROVE',
      status: 'COMPLETED',
      completedAt: '2026-09-09T02:00:00Z',
    };

    service.submitAction('task-1', actionReq).subscribe((result) => {
      expect(result).toEqual(actionRes);
    });

    const req = httpMock.expectOne(`${baseUrl}/task-1/actions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(actionReq);
    req.flush({ data: actionRes });
  });
});
