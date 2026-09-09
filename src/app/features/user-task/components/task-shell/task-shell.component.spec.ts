import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { I18nService } from '@core/i18n/i18n.service';
import { AlertComponent } from '@shared/ui/feedback/alert/alert.component';
import { TimelineComponent } from '@shared/ui/data-display/timeline/timeline.component';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskModule } from '../../user-task.module';
import { TaskShellComponent } from './task-shell.component';

describe('TaskShellComponent', () => {
  let fixture: ComponentFixture<TaskShellComponent>;
  let store: {
    state: ReturnType<typeof signal<string>>;
    detail: ReturnType<typeof signal<unknown>>;
    task: ReturnType<typeof signal<unknown>>;
    formKey: ReturnType<typeof signal<string>>;
    history: ReturnType<typeof signal<never[]>>;
    historyLoading: ReturnType<typeof signal<boolean>>;
    historyError: ReturnType<typeof signal<string | null>>;
    historyErrorCode: ReturnType<typeof signal<string | null>>;
    error: ReturnType<typeof signal<string | null>>;
    errorCode: ReturnType<typeof signal<string | null>>;
    comment: ReturnType<typeof signal<string>>;
    commentError: ReturnType<typeof signal<string | null>>;
    activeAction: ReturnType<typeof signal<string | null>>;
    liveAnnouncement: ReturnType<typeof signal<string>>;
    allowedActions: ReturnType<typeof signal<string[]>>;
    isReadOnly: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof vi.fn>;
    isSubmitting: ReturnType<typeof vi.fn>;
    isReady: ReturnType<typeof vi.fn>;
    setComment: ReturnType<typeof vi.fn>;
    initiateAction: ReturnType<typeof vi.fn>;
    registerAdapter: ReturnType<typeof vi.fn>;
    unregisterAdapter: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const task = {
      taskId: 'task-101',
      processInstanceId: 'process-202',
      businessKey: 'business-303',
      formKey: 'APPROVAL',
      taskName: 'Review request',
      processDefinitionName: 'Approval Process',
      assignee: 'current-user',
      createdAt: '2026-09-09T08:00:00Z',
      priority: 50,
      completed: false,
      claimable: false,
      readOnly: false,
      canAct: true,
      allowedActions: [],
    };
    const detail = {
      task,
      supported: true,
      content: null,
      allowedActions: [],
      permission: {
        visible: true,
        claimable: false,
        readOnly: false,
        canAct: true,
      },
    };

    store = {
      state: signal('READY'),
      detail: signal(detail),
      task: signal(task),
      formKey: signal('APPROVAL'),
      history: signal([]),
      historyLoading: signal(false),
      historyError: signal<string | null>(null),
      historyErrorCode: signal<string | null>(null),
      error: signal<string | null>(null),
      errorCode: signal<string | null>(null),
      comment: signal(''),
      commentError: signal<string | null>(null),
      activeAction: signal<string | null>(null),
      liveAnnouncement: signal('userTask.live.ready'),
      allowedActions: signal([]),
      isReadOnly: vi.fn(() => false),
      isLoading: vi.fn(() => false),
      isSubmitting: vi.fn(() => false),
      isReady: vi.fn(() => true),
      setComment: vi.fn(),
      initiateAction: vi.fn(() => Promise.resolve(false)),
      registerAdapter: vi.fn(),
      unregisterAdapter: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [
        { provide: TaskHostStore, useValue: store },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskShellComponent);
    fixture.detectChanges();
  });

  it('renders valid translated aria labels on task content and sidebar regions', () => {
    const content = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);

    expect(content.querySelector('.task-shell__content section')?.getAttribute('aria-label')).toBe(
      i18n.t('userTask.screen.ariaTaskContent'),
    );
    expect(content.querySelector('.task-shell__content aside')?.getAttribute('aria-label')).toBe(
      i18n.t('userTask.screen.ariaTaskSidebar'),
    );
  });

  it('displays backend errorCode and errorMessage as separate alert fields', () => {
    store.errorCode.set('TASK_ACTION_CONFLICT');
    store.error.set('Task was updated by another user');
    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.directive(AlertComponent))
      .componentInstance as AlertComponent;
    expect(alert.title).toBe('[TASK_ACTION_CONFLICT]');
    expect(alert.message).toBe('Task was updated by another user');
  });

  it('surfaces structured history errors instead of rendering a fake empty state', () => {
    store.historyErrorCode.set('HISTORY_UNAVAILABLE');
    store.historyError.set('History service unavailable');
    fixture.detectChanges();

    const timelines = fixture.debugElement.queryAll(By.directive(TimelineComponent));
    expect(timelines).toHaveLength(1);
    for (const timelineDebugElement of timelines) {
      const timeline = timelineDebugElement.componentInstance as TimelineComponent;
      expect(timeline.error).toBe('[HISTORY_UNAVAILABLE] History service unavailable');
    }

    expect((fixture.nativeElement as HTMLElement).querySelector('app-error-state')).toBeTruthy();
  });
});
