import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowRunDialogComponent } from './workflow-run-dialog.component';

describe('WorkflowRunDialogComponent', () => {
  let fixture: ComponentFixture<WorkflowRunDialogComponent>;
  let component: WorkflowRunDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkflowRunDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(WorkflowRunDialogComponent);
    component = fixture.componentInstance;
  });

  it('rejects invalid JSON input without emitting a run request', () => {
    const requested = vi.fn();
    component.runRequested.subscribe(requested);

    component.inputText.set('{bad json');
    component.submit();

    expect(requested).not.toHaveBeenCalled();
    expect(component.error()).toBe('workflowStudio.lifecycle.runInvalidJson');
  });

  it('emits parsed JSON input for a valid run request', () => {
    const requested = vi.fn();
    component.runRequested.subscribe(requested);

    component.inputText.set('{"profile":{"id":"koc-1"}}');
    component.submit();

    expect(requested).toHaveBeenCalledWith({ profile: { id: 'koc-1' } });
    expect(component.error()).toBeNull();
  });
});
