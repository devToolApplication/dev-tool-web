import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InputArea } from '@shared/ui/primitives/input-area/input-area';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskModule } from '../../user-task.module';
import { TaskActionBarComponent } from './task-action-bar.component';

describe('TaskActionBarComponent', () => {
  let fixture: ComponentFixture<TaskActionBarComponent>;
  let component: TaskActionBarComponent;
  let store: {
    comment: ReturnType<typeof signal<string>>;
    commentError: ReturnType<typeof signal<string | null>>;
    allowedActions: ReturnType<typeof signal<string[]>>;
    activeAction: ReturnType<typeof signal<string | null>>;
    setComment: ReturnType<typeof vi.fn>;
    initiateAction: ReturnType<typeof vi.fn>;
    isSubmitting: ReturnType<typeof vi.fn>;
    isReady: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    store = {
      comment: signal(''),
      commentError: signal<string | null>(null),
      allowedActions: signal(['APPROVE', 'REJECT', 'RETURN']),
      activeAction: signal<string | null>(null),
      setComment: vi.fn(),
      initiateAction: vi.fn(() => Promise.resolve(false)),
      isSubmitting: vi.fn(() => false),
      isReady: vi.fn(() => true),
    };

    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [{ provide: TaskHostStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskActionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps over-limit comments intact so validation can reject without silent data loss', () => {
    const comment = 'a'.repeat(2001);

    component.onCommentChange(comment);

    expect(store.setComment).toHaveBeenCalledWith(comment);
  });

  it('connects the external label to the shared input textarea', () => {
    const inputArea = fixture.debugElement.query(By.directive(InputArea))
      .componentInstance as InputArea;

    expect(inputArea.inputId).toBe('task-action-comment-input');
  });

  it('restores focus to the action trigger after cancellation or submission error', async () => {
    vi.useFakeTimers();
    const trigger = document.createElement('button');
    const focusSpy = vi.spyOn(trigger, 'focus');

    await component.onAction('REJECT', trigger);
    expect(focusSpy).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(store.initiateAction).toHaveBeenCalledWith('REJECT');
    expect(focusSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
