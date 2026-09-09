import { Component, Input, OnDestroy, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '@core/notifications/toast.service';
import { ConfirmDialogService } from '@shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { SharedModule } from '@shared/shared.module';
import { TaskShellComponent } from '../../components/task-shell/task-shell.component';
import { TaskScreenAdapter } from '../../models/task-screen-adapter.model';
import { UserTaskDetail, UserTaskHistoryItem, UserTaskSummary } from '../../models/user-task.model';
import { TaskScreenRegistry } from '../../registry/task-screen.registry';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskApiService } from '../../services/user-task-api.service';
import { UserTaskModule } from '../../user-task.module';
import { TaskHostComponent } from './task-host.component';

@Component({
  selector: 'app-mock-task-screen',
  standalone: false,
  template: `<div class="mock-screen">Mock Screen Content: {{ task?.taskId }}</div>`,
})
class MockTaskScreenComponent implements OnInit, OnDestroy, TaskScreenAdapter {
  @Input() task?: UserTaskSummary;
  @Input() content?: unknown;

  constructor(private readonly store: TaskHostStore) {}

  ngOnInit(): void {
    this.store.registerAdapter(this);
  }

  ngOnDestroy(): void {
    this.store.unregisterAdapter(this);
  }

  validate(action: string): boolean {
    return true;
  }

  buildVariables(action: string): Record<string, unknown> {
    return { screenSubmitted: true };
  }
}

describe('TaskHostComponent and Shell Integration', () => {
  let fixture: ComponentFixture<TaskHostComponent>;
  let component: TaskHostComponent;
  let apiService: {
    getTask: ReturnType<typeof vi.fn>;
    getTaskHistory: ReturnType<typeof vi.fn>;
    claimTask: ReturnType<typeof vi.fn>;
    submitAction: ReturnType<typeof vi.fn>;
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
      businessKey: 'campaign-888',
      formKey: 'MOCK_FORM_KEY',
      taskName: 'Human Review - Campaign 888',
      processDefinitionName: 'KOC Discovery Process',
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
    content: { title: 'Review candidates' },
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
      userId: 'lamld',
      time: '2026-09-09T08:05:00Z',
      message: 'Claimed by lamld',
    },
  ];

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [UserTaskModule, SharedModule],
      declarations: [MockTaskScreenComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ taskId: 'task-101' })),
            snapshot: { paramMap: convertToParamMap({ taskId: 'task-101' }) },
          },
        },
        { provide: UserTaskApiService, useValue: apiService },
        { provide: ToastService, useValue: toastService },
        { provide: ConfirmDialogService, useValue: confirmDialogService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    const registry = TestBed.inject(TaskScreenRegistry);
    registry.register({
      formKey: 'MOCK_FORM_KEY',
      component: MockTaskScreenComponent,
      screenTitleKey: 'userTask.kocApproval.title',
    });
  });

  const setupComponent = async (): Promise<void> => {
    fixture = TestBed.createComponent(TaskHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.store.isLoading()).toBe(false));
    fixture.detectChanges();
  };

  it('renders task header, dynamic child screen, metadata panel, and action bar when task is READY', async () => {
    await setupComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.task-shell')).toBeTruthy();
    expect(compiled.textContent).toContain('Human Review - Campaign 888');
    expect(compiled.textContent).toContain('MOCK_FORM_KEY');

    // Dynamic screen registered by formKey is rendered
    expect(compiled.querySelector('.mock-screen')).toBeTruthy();
    expect(compiled.textContent).toContain('Mock Screen Content: task-101');

    // Action bar buttons render exact backend allowedActions
    const buttons = compiled.querySelectorAll('.task-action-bar app-button');
    expect(buttons.length).toBe(3);

    // Live region announcements
    const liveRegion = compiled.querySelector('#task-shell-live-region');
    expect(liveRegion).toBeTruthy();

    const screenDebugElement = fixture.debugElement.query(By.directive(MockTaskScreenComponent));
    expect(screenDebugElement.injector.get(TaskHostStore)).toBe(component.store);
    expect(component.store.adapter()).toBe(screenDebugElement.componentInstance);
  });

  it('auto-claims unassigned task on load and transitions to READY', async () => {
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
      .mockReturnValue(of(claimedDetail));

    await setupComponent();

    expect(apiService.claimTask).toHaveBeenCalledTimes(1);
    expect(apiService.claimTask).toHaveBeenCalledWith('task-101');
    expect(component.store.state()).toBe('READY');
  });

  it('handles 409 claim conflict by reloading detail and switching to READ_ONLY banner without action buttons', async () => {
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
        assignee: 'someone-else',
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
      .mockReturnValue(of(conflictDetail));
    apiService.claimTask.mockReturnValueOnce(
      throwError(() => ({
        status: 409,
        error: { errorCode: 'TASK_ACTION_CONFLICT', errorMessage: 'Conflict: Already claimed by someone-else' },
      })),
    );

    await setupComponent();

    expect(component.store.state()).toBe('READ_ONLY');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.task-action-bar')).toBeFalsy();
    expect(toastService.error).toHaveBeenCalledWith('TASK_ACTION_CONFLICT', 'Conflict: Already claimed by someone-else');
  });

  it('renders read-only banner and no action buttons for completed tasks', async () => {
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

    await setupComponent();

    expect(component.store.state()).toBe('COMPLETED');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.task-action-bar')).toBeFalsy();
    expect(compiled.querySelector('app-alert')).toBeTruthy();
  });

  it('renders unsupported task screen and admin contact guidance for unsupported formKeys', async () => {
    const unsupportedDetail = createDetail({
      supported: false,
      task: {
        ...createDetail().task,
        formKey: 'UNKNOWN_LEGACY_SCREEN',
      },
      allowedActions: [],
    });
    apiService.getTask.mockReturnValue(of(unsupportedDetail));

    await setupComponent();

    expect(component.store.state()).toBe('UNSUPPORTED');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-unsupported-task-screen')).toBeTruthy();
    expect(compiled.querySelector('.task-action-bar')).toBeFalsy();
  });

  it('opens history drawer and displays timeline (REQ-P16-04)', async () => {
    await setupComponent();

    const shellDe = fixture.debugElement.query(By.directive(TaskShellComponent));
    const shell = shellDe.componentInstance as TaskShellComponent;
    expect(shell.isHistoryDrawerOpen()).toBe(false);

    // Click "View History" button in header
    shell.openHistoryDrawer();
    fixture.detectChanges();

    expect(shell.isHistoryDrawerOpen()).toBe(true);
    expect(shell.timelineItems().length).toBe(1);
    expect(shell.timelineItems()[0].title).toContain('lamld');

    shell.closeHistoryDrawer();
    fixture.detectChanges();
    expect(shell.isHistoryDrawerOpen()).toBe(false);
  });

  it('submits action with confirmation, shows success toast and navigates to /tasks', async () => {
    await setupComponent();

    component.store.setComment('Looks fantastic');

    const result = await component.store.initiateAction('APPROVE');
    expect(result).toBe(true);

    expect(confirmDialogService.confirm).toHaveBeenCalled();
    expect(apiService.submitAction).toHaveBeenCalledTimes(1);

    const [, payload] = apiService.submitAction.mock.calls[0];
    expect(payload.action).toBe('APPROVE');
    expect(payload.comment).toBe('Looks fantastic');
    expect(payload.variables).toEqual({ screenSubmitted: true });

    expect(component.store.state()).toBe('COMPLETED');
    expect(toastService.success).toHaveBeenCalledWith('userTask.success.action');
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('network error on action retains form state and comment, allowing retry with same requestId', async () => {
    await setupComponent();

    component.store.setComment('Important comment to retain');

    apiService.submitAction.mockReturnValueOnce(
      throwError(() => ({
        error: { errorCode: 'CONNECTION_ERROR', errorMessage: 'Server timeout' },
      })),
    );

    const firstAttempt = await component.store.initiateAction('APPROVE');
    expect(firstAttempt).toBe(false);

    expect(component.store.state()).toBe('READY');
    expect(component.store.comment()).toBe('Important comment to retain');
    expect(toastService.error).toHaveBeenCalledWith('CONNECTION_ERROR', 'Server timeout');

    const originalRequestId = component.store.currentRequestId();
    expect(originalRequestId).toBeTruthy();

    // Successful retry with same payload
    apiService.submitAction.mockReturnValueOnce(
      of({
        taskId: 'task-101',
        requestId: originalRequestId!,
        action: 'APPROVE',
        status: 'COMPLETED',
        completedAt: '2026-09-09T08:50:00Z',
      }),
    );

    const secondAttempt = await component.store.initiateAction('APPROVE');
    expect(secondAttempt).toBe(true);

    const [, retryPayload] = apiService.submitAction.mock.calls[1];
    expect(retryPayload.requestId).toBe(originalRequestId);
    expect(component.store.state()).toBe('COMPLETED');
  });
});
