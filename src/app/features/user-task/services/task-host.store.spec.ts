import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { TaskScreenAdapter } from '../models/task-screen-adapter.model';
import { UserTaskDetail, UserTaskHistoryItem } from '../models/user-task.model';
import { TaskScreenRegistry } from '../registry/task-screen.registry';
import { TaskHostStore } from './task-host.store';
import { UserTaskApiService } from './user-task-api.service';

describe('TaskHostStore', () => {
  let store: TaskHostStore;
  let apiService: {
    getTask: ReturnType<typeof vi.fn>;
    getTaskHistory: ReturnType<typeof vi.fn>;
    claimTask: ReturnType<typeof vi.fn>;
    submitAction: ReturnType<typeof vi.fn>;
  };
  let registry: {
    isSupported: ReturnType<typeof vi.fn>;
  };
  let toastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let confirmDialogService: {
    confirm: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const createDetail = (overrides: Partial<UserTaskDetail> = {}): UserTaskDetail => ({
    task: {
      taskId: 'task-101',
      processInstanceId: 'proc-202',
      businessKey: 'biz-303',
      formKey: 'APPROVAL',
      taskName: 'Review Request',
      processDefinitionName: 'Approval Process',
      assignee: 'current-user',
      createdAt: '2026-09-09T08:00:00Z',
      dueAt: '2026-09-10T08:00:00Z',
      priority: 50,
      completed: false,
      claimable: false,
      readOnly: false,
      canAct: true,
      allowedActions: ['APPROVE', 'REJECT', 'RETURN'],
    },
    supported: true,
    content: { title: 'Test Request' },
    allowedActions: ['APPROVE', 'REJECT', 'RETURN'],
    permission: {
      visible: true,
      claimable: false,
      readOnly: false,
      canAct: true,
    },
    ...overrides,
  });

  const mockHistory: UserTaskHistoryItem[] = [
    {
      id: 'h-1',
      taskId: 'task-101',
      processInstanceId: 'proc-202',
      type: 'CLAIM',
      userId: 'current-user',
      time: '2026-09-09T08:05:00Z',
      message: 'Claimed',
    },
  ];

  beforeEach(() => {
    apiService = {
      getTask: vi.fn(() => of(createDetail())),
      getTaskHistory: vi.fn(() => of(mockHistory)),
      claimTask: vi.fn(() => of(createDetail().task)),
      submitAction: vi.fn(() =>
        of({
          taskId: 'task-101',
          requestId: 'req-1',
          action: 'APPROVE',
          status: 'COMPLETED',
          completedAt: '2026-09-09T08:30:00Z',
        }),
      ),
    };

    registry = {
      isSupported: vi.fn((key) => key === 'APPROVAL'),
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    confirmDialogService = {
      confirm: vi.fn(() => Promise.resolve(true)),
    };

    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskHostStore,
        { provide: UserTaskApiService, useValue: apiService },
        { provide: TaskScreenRegistry, useValue: registry },
        { provide: ToastService, useValue: toastService },
        { provide: ConfirmDialogService, useValue: confirmDialogService },
        { provide: Router, useValue: router },
      ],
    });

    store = TestBed.inject(TaskHostStore);
  });

  it('initializes with LOADING state and null detail', () => {
    expect(store.state()).toBe('LOADING');
    expect(store.detail()).toBeNull();
    expect(store.history()).toEqual([]);
    expect(store.allowedActions()).toEqual([]);
  });

  it('loads detail and permitted history, transitioning to READY', async () => {
    await store.load('task-101');

    expect(store.state()).toBe('READY');
    expect(store.taskId()).toBe('task-101');
    expect(store.task()?.taskName).toBe('Review Request');
    expect(store.history().length).toBe(1);
    expect(store.allowedActions()).toEqual(['APPROVE', 'REJECT', 'RETURN']);
    expect(store.isReadOnly()).toBe(false);
  });

  it('renders exact allowedActions from backend and does not infer', async () => {
    const customDetail = createDetail({
      allowedActions: ['CONFIRM'],
      task: {
        ...createDetail().task,
        allowedActions: ['CONFIRM'],
      },
    });
    apiService.getTask.mockReturnValue(of(customDetail));

    await store.load('task-101');
    expect(store.allowedActions()).toEqual(['CONFIRM']);
  });

  it('auto-claims exactly once when claimable, then reloads detail and becomes READY', async () => {
    const claimableDetail = createDetail({
      task: {
        ...createDetail().task,
        assignee: undefined,
        claimable: true,
        canAct: false,
      },
      permission: {
        visible: true,
        claimable: true,
        readOnly: false,
        canAct: false,
      },
    });
    const claimedDetail = createDetail({
      task: {
        ...createDetail().task,
        assignee: 'current-user',
        claimable: false,
        canAct: true,
      },
    });

    apiService.getTask
      .mockReturnValueOnce(of(claimableDetail))
      .mockReturnValueOnce(of(claimedDetail));

    await store.load('task-101');

    expect(apiService.claimTask).toHaveBeenCalledTimes(1);
    expect(apiService.claimTask).toHaveBeenCalledWith('task-101');
    expect(apiService.getTask).toHaveBeenCalledTimes(2);
    expect(store.state()).toBe('READY');
    expect(store.claimAttempted()).toBe(true);
  });

  it('does not auto-claim the same task again when it is reloaded', async () => {
    const claimableDetail = createDetail({
      task: {
        ...createDetail().task,
        assignee: undefined,
        claimable: true,
        canAct: false,
      },
      permission: {
        visible: true,
        claimable: true,
        readOnly: false,
        canAct: false,
      },
    });
    const claimedDetail = createDetail();

    apiService.getTask
      .mockReturnValueOnce(of(claimableDetail))
      .mockReturnValueOnce(of(claimedDetail))
      .mockReturnValueOnce(of(claimableDetail));

    await store.load('task-101');
    await store.load('task-101');

    expect(apiService.claimTask).toHaveBeenCalledTimes(1);
    expect(store.claimAttempted()).toBe(true);
    expect(store.state()).toBe('READ_ONLY');
  });

  it('transitions to READ_ONLY when claim conflict occurs and another assignee owns it or canAct is false', async () => {
    const claimableDetail = createDetail({
      task: {
        ...createDetail().task,
        assignee: undefined,
        claimable: true,
      },
    });
    const conflictDetail = createDetail({
      task: {
        ...createDetail().task,
        assignee: 'other-user',
        claimable: false,
        readOnly: true,
        canAct: false,
      },
      allowedActions: [],
      permission: {
        visible: true,
        claimable: false,
        readOnly: true,
        canAct: false,
      },
    });

    apiService.getTask
      .mockReturnValueOnce(of(claimableDetail))
      .mockReturnValueOnce(of(conflictDetail));
    apiService.claimTask.mockReturnValueOnce(
      throwError(() => ({
        status: 409,
        error: { errorCode: 'TASK_ALREADY_CLAIMED', errorMessage: 'Task already claimed by another user' },
      })),
    );

    await store.load('task-101');

    expect(store.state()).toBe('READ_ONLY');
    expect(store.isReadOnly()).toBe(true);
    expect(store.errorCode()).toBe('TASK_ALREADY_CLAIMED');
    expect(store.error()).toBe('Task already claimed by another user');
    expect(toastService.error).toHaveBeenCalledWith('TASK_ALREADY_CLAIMED', 'Task already claimed by another user');
  });

  it('claim failure reload strictly checks canAct=false and never sets READY', async () => {
    const claimableDetail = createDetail({
      task: {
        ...createDetail().task,
        claimable: true,
      },
    });
    const unclaimableWithoutActions = createDetail({
      task: {
        ...createDetail().task,
        claimable: false,
        canAct: false,
      },
      permission: {
        visible: true,
        claimable: false,
        readOnly: false,
        canAct: false,
      },
      allowedActions: [],
    });

    apiService.getTask
      .mockReturnValueOnce(of(claimableDetail))
      .mockReturnValueOnce(of(unclaimableWithoutActions));
    apiService.claimTask.mockReturnValueOnce(
      throwError(() => ({ status: 400, error: { message: 'Cannot claim' } })),
    );

    await store.load('task-101');
    expect(store.state()).toBe('READ_ONLY');
  });

  it('transitions to READ_ONLY when loaded task is completed', async () => {
    const completedDetail = createDetail({
      task: {
        ...createDetail().task,
        completed: true,
        readOnly: true,
        canAct: false,
      },
      allowedActions: [],
    });
    apiService.getTask.mockReturnValue(of(completedDetail));

    await store.load('task-101');

    expect(store.state()).toBe('COMPLETED');
    expect(store.isCompleted()).toBe(true);
    expect(store.isReadOnly()).toBe(true);
    expect(store.allowedActions()).toEqual([]);
  });

  it('transitions to UNSUPPORTED when detail.supported is false or registry does not support formKey', async () => {
    const unsupportedDetail = createDetail({
      supported: false,
      task: {
        ...createDetail().task,
        formKey: 'UNKNOWN_FORM_KEY',
      },
    });
    registry.isSupported.mockReturnValue(false);
    apiService.getTask.mockReturnValue(of(unsupportedDetail));

    await store.load('task-101');

    expect(store.state()).toBe('UNSUPPORTED');
    expect(store.allowedActions()).toEqual([]);
    expect(store.isReadOnly()).toBe(true);
  });

  it('transitions to FORBIDDEN when API responds with 403 and extracts backend errorCode and errorMessage', async () => {
    apiService.getTask.mockReturnValue(
      throwError(() => ({
        status: 403,
        error: { errorCode: 'ACCESS_DENIED', errorMessage: 'You lack realm-role approver' },
      })),
    );

    await store.load('task-101');

    expect(store.state()).toBe('FORBIDDEN');
    expect(store.errorCode()).toBe('ACCESS_DENIED');
    expect(store.error()).toBe('You lack realm-role approver');
    expect(toastService.error).toHaveBeenCalledWith('ACCESS_DENIED', 'You lack realm-role approver');
  });

  it('clears stale detail and actions when an unknown deep link returns 404', async () => {
    await store.load('task-101');
    expect(store.detail()).not.toBeNull();

    apiService.getTask.mockReturnValueOnce(
      throwError(() => ({
        status: 404,
        error: {
          errorCode: 'USER_TASK_NOT_FOUND',
          errorMessage: 'Task does not exist',
        },
      })),
    );
    apiService.getTaskHistory.mockReturnValueOnce(of([]));

    await store.load('missing-task');

    expect(store.state()).toBe('READ_ONLY');
    expect(store.detail()).toBeNull();
    expect(store.allowedActions()).toEqual([]);
    expect(store.errorCode()).toBe('USER_TASK_NOT_FOUND');
    expect(store.error()).toBe('Task does not exist');
  });

  it('ignores a stale detail response after navigation starts loading another task', async () => {
    const oldDetail$ = new Subject<UserTaskDetail>();
    const newDetail$ = new Subject<UserTaskDetail>();
    const oldDetail = createDetail({
      task: {
        ...createDetail().task,
        taskId: 'task-old',
        taskName: 'Old task',
      },
    });
    const newDetail = createDetail({
      task: {
        ...createDetail().task,
        taskId: 'task-new',
        taskName: 'New task',
      },
    });

    apiService.getTask.mockImplementation((taskId: string) =>
      taskId === 'task-old' ? oldDetail$.asObservable() : newDetail$.asObservable(),
    );
    apiService.getTaskHistory.mockReturnValue(of([]));

    const oldLoad = store.load('task-old');
    const newLoad = store.load('task-new');

    newDetail$.next(newDetail);
    newDetail$.complete();
    await newLoad;

    oldDetail$.next(oldDetail);
    oldDetail$.complete();
    await oldLoad;

    expect(store.taskId()).toBe('task-new');
    expect(store.task()?.taskName).toBe('New task');
    expect(store.state()).toBe('READY');
  });

  it('exposes backend history errors instead of treating the result as an empty success', async () => {
    apiService.getTaskHistory.mockReturnValueOnce(
      throwError(() => ({
        status: 503,
        error: {
          errorCode: 'HISTORY_UNAVAILABLE',
          errorMessage: 'History service unavailable',
        },
      })),
    );

    await store.load('task-101');

    expect(store.history()).toEqual([]);
    expect(store.historyLoading()).toBe(false);
    expect(store.historyErrorCode()).toBe('HISTORY_UNAVAILABLE');
    expect(store.historyError()).toBe('History service unavailable');
    expect(toastService.error).toHaveBeenCalledWith(
      'HISTORY_UNAVAILABLE',
      'History service unavailable',
    );
  });

  it('validates required comments on REJECT and RETURN', async () => {
    await store.load('task-101');

    const rejectVal = store.validate('REJECT');
    expect(rejectVal.valid).toBe(false);
    expect(rejectVal.errorMessage).toBe('userTask.confirm.commentRequired');

    store.setComment('   ');
    expect(store.validate('REJECT').valid).toBe(false);

    store.setComment('Reason for rejection');
    expect(store.validate('REJECT').valid).toBe(true);

    store.setComment('');
    expect(store.validate('RETURN').valid).toBe(false);
    store.setComment('Please adjust details');
    expect(store.validate('RETURN').valid).toBe(true);

    store.setComment('');
    expect(store.validate('APPROVE').valid).toBe(true);
  });

  it('validates comment maximum length of 2000 characters', async () => {
    await store.load('task-101');
    const longComment = 'a'.repeat(2001);
    store.setComment(longComment);

    const val = store.validate('APPROVE');
    expect(val.valid).toBe(false);
    expect(val.errorMessage).toBe('userTask.comment.maxLength');
  });

  it('blocks action when child screen adapter validation fails', async () => {
    await store.load('task-101');

    const adapter: TaskScreenAdapter = {
      validate: vi.fn((action: string) =>
        action === 'APPROVE' ? { valid: false, errorMessage: 'Select at least 1 candidate' } : true,
      ),
      buildVariables: vi.fn(() => ({})),
    };

    store.registerAdapter(adapter);

    const success = await store.initiateAction('APPROVE');
    expect(success).toBe(false);
    expect(toastService.error).toHaveBeenCalledWith('error', 'Select at least 1 candidate');
    expect(confirmDialogService.confirm).not.toHaveBeenCalled();
    expect(apiService.submitAction).not.toHaveBeenCalled();

    store.unregisterAdapter(adapter);
  });

  it('keeps a newer adapter registered and clears the active adapter when another task loads', async () => {
    const firstAdapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({})),
    };
    const secondAdapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({})),
    };

    store.registerAdapter(firstAdapter);
    store.registerAdapter(secondAdapter);
    store.unregisterAdapter(firstAdapter);
    expect(store.adapter()).toBe(secondAdapter);

    await store.load('task-101');

    expect(store.adapter()).toBeNull();
  });

  it('cancelling confirmation dialog returns state to READY', async () => {
    await store.load('task-101');
    confirmDialogService.confirm.mockResolvedValueOnce(false);

    const result = await store.initiateAction('APPROVE');
    expect(result).toBe(false);
    expect(store.state()).toBe('READY');
    expect(apiService.submitAction).not.toHaveBeenCalled();
  });

  it('submits action on confirmation: generates UUID requestId, toasts success and navigates', async () => {
    await store.load('task-101');
    store.setComment('Looks good');

    const adapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({ approved: true })),
    };
    store.registerAdapter(adapter);

    const result = await store.initiateAction('APPROVE');

    expect(result).toBe(true);
    expect(confirmDialogService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'userTask.confirm.title',
        message: 'userTask.confirm.message',
        confirmText: 'userTask.actions.submit',
        cancelText: 'userTask.actions.cancel',
      }),
    );
    expect(apiService.submitAction).toHaveBeenCalledTimes(1);

    const [, payload] = apiService.submitAction.mock.calls[0];
    expect(payload.action).toBe('APPROVE');
    expect(payload.variables).toEqual({ approved: true });
    expect(payload.comment).toBe('Looks good');
    expect(payload.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(store.state()).toBe('COMPLETED');
    expect(toastService.success).toHaveBeenCalledWith('userTask.success.action');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('preserves same requestId when retrying identical action and payload after failure', async () => {
    await store.load('task-101');
    store.setComment('Identical comment');

    const adapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({ candidateIds: ['c1', 'c2'] })),
    };
    store.registerAdapter(adapter);

    apiService.submitAction.mockReturnValueOnce(
      throwError(() => ({
        error: { errorCode: 'FLOWABLE_TRANSACTION_ERROR', errorMessage: 'Optimistic lock' },
      })),
    );

    const firstAttempt = await store.initiateAction('APPROVE');
    expect(firstAttempt).toBe(false);
    expect(store.state()).toBe('READY');
    expect(store.errorCode()).toBe('FLOWABLE_TRANSACTION_ERROR');
    expect(store.error()).toBe('Optimistic lock');

    const firstRequestId = store.currentRequestId();
    expect(firstRequestId).toBeTruthy();

    // Retry with exact same action and adapter variables
    apiService.submitAction.mockReturnValueOnce(
      of({
        taskId: 'task-101',
        requestId: firstRequestId!,
        action: 'APPROVE',
        status: 'COMPLETED',
        completedAt: '2026-09-09T08:40:00Z',
      }),
    );

    const secondAttempt = await store.initiateAction('APPROVE');
    expect(secondAttempt).toBe(true);

    const [, secondPayload] = apiService.submitAction.mock.calls[1];
    expect(secondPayload.requestId).toBe(firstRequestId);
  });

  it('generates a NEW requestId when action or adapter payload changes after a failed attempt', async () => {
    await store.load('task-101');
    store.setComment('Some feedback');

    let currentCandidateIds = ['c1'];
    const adapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({ candidateIds: [...currentCandidateIds] })),
    };
    store.registerAdapter(adapter);

    // 1. First attempt fails
    apiService.submitAction.mockReturnValueOnce(
      throwError(() => ({
        error: { errorCode: 'TASK_ACTION_CONFLICT', errorMessage: 'Conflict occurred' },
      })),
    );

    const firstAttempt = await store.initiateAction('APPROVE');
    expect(firstAttempt).toBe(false);
    const firstRequestId = store.currentRequestId();
    expect(firstRequestId).toBeTruthy();

    // 2. User modifies payload (selects another candidate)
    currentCandidateIds = ['c1', 'c2', 'c3'];

    apiService.submitAction.mockReturnValueOnce(
      of({
        taskId: 'task-101',
        requestId: 'fresh-req',
        action: 'APPROVE',
        status: 'COMPLETED',
        completedAt: '2026-09-09T08:42:00Z',
      }),
    );

    const secondAttempt = await store.initiateAction('APPROVE');
    expect(secondAttempt).toBe(true);

    const [, secondPayload] = apiService.submitAction.mock.calls[1];
    expect(secondPayload.requestId).not.toBe(firstRequestId);
    expect(secondPayload.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(secondPayload.variables).toEqual({ candidateIds: ['c1', 'c2', 'c3'] });
  });

  it('generates a NEW requestId when action changes after a failed attempt', async () => {
    await store.load('task-101');
    store.setComment('Feedback note');

    const adapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({})),
    };
    store.registerAdapter(adapter);

    apiService.submitAction.mockReturnValueOnce(
      throwError(() => ({
        error: { errorCode: 'TEMPORARY_ERROR', errorMessage: 'Server busy' },
      })),
    );

    const firstAttempt = await store.initiateAction('APPROVE');
    expect(firstAttempt).toBe(false);
    const firstRequestId = store.currentRequestId();

    // User switches action to REJECT
    apiService.submitAction.mockReturnValueOnce(
      of({
        taskId: 'task-101',
        requestId: 'reject-req',
        action: 'REJECT',
        status: 'COMPLETED',
        completedAt: '2026-09-09T08:45:00Z',
      }),
    );

    const secondAttempt = await store.initiateAction('REJECT');
    expect(secondAttempt).toBe(true);

    const [, secondPayload] = apiService.submitAction.mock.calls[1];
    expect(secondPayload.requestId).not.toBe(firstRequestId);
    expect(secondPayload.action).toBe('REJECT');
  });

  it('generates a NEW requestId when the comment payload changes after a failed attempt', async () => {
    await store.load('task-101');
    store.setComment('Original comment');

    const adapter: TaskScreenAdapter = {
      validate: vi.fn(() => true),
      buildVariables: vi.fn(() => ({ approved: true })),
    };
    store.registerAdapter(adapter);
    apiService.submitAction.mockReturnValueOnce(
      throwError(() => ({
        error: { errorCode: 'TEMPORARY_ERROR', errorMessage: 'Server busy' },
      })),
    );

    expect(await store.initiateAction('APPROVE')).toBe(false);
    const firstRequestId = store.currentRequestId();

    store.setComment('Changed comment');
    apiService.submitAction.mockReturnValueOnce(
      of({
        taskId: 'task-101',
        requestId: 'new-request',
        action: 'APPROVE',
        status: 'COMPLETED',
        completedAt: '2026-09-09T08:50:00Z',
      }),
    );

    expect(await store.initiateAction('APPROVE')).toBe(true);

    const [, secondPayload] = apiService.submitAction.mock.calls[1];
    expect(secondPayload.requestId).not.toBe(firstRequestId);
    expect(secondPayload.comment).toBe('Changed comment');
  });
});
