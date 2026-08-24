import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform, SimpleChange } from '@angular/core';

import { WorkflowValidationIssue } from '../model/workflow-studio.model';
import { WorkflowProblemsPanelComponent } from './workflow-problems-panel.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('WorkflowProblemsPanelComponent', () => {
  let fixture: ComponentFixture<WorkflowProblemsPanelComponent>;
  let component: WorkflowProblemsPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkflowProblemsPanelComponent, TranslateContentPipeStub],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowProblemsPanelComponent);
    component = fixture.componentInstance;
  });

  it('renders only a compact header when there are no issues and starts collapsed', () => {
    component.issues = [];
    component.ngOnChanges({ issues: new SimpleChange(null, [], true) });

    fixture.detectChanges();

    expect(component.collapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.workflow-problems__count')?.textContent).toContain(
      '0',
    );
    expect(fixture.nativeElement.querySelector('.workflow-problems__toggle')).toBeNull();
    expect(fixture.nativeElement.querySelector('#workflow-problems-list')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('workflowStudio.problems.empty');
  });

  it('expands automatically when issues are added and renders validation references', () => {
    const selected: WorkflowValidationIssue[] = [];
    const issue: WorkflowValidationIssue = {
      code: 'AI_GATE_INSTRUCTION_REQUIRED',
      severity: 'error',
      nodeId: 'ai',
      field: 'instruction',
      message: 'AI instruction is required',
    };
    component.issues = [issue];
    component.ngOnChanges({ issues: new SimpleChange([], [issue], false) });
    component.issueSelected.subscribe((i) => selected.push(i));

    fixture.detectChanges();

    expect(component.collapsed()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('AI instruction is required');
    expect(fixture.nativeElement.textContent).toContain('ai');
    expect(fixture.nativeElement.textContent).toContain('instruction');

    fixture.nativeElement.querySelector('.workflow-problems__button').click();
    expect(selected[0]).toEqual(issue);
  });

  it('collapses when issues become empty after validation', () => {
    const issue: WorkflowValidationIssue = {
      code: 'START_INVALID',
      severity: 'error',
      nodeId: 'start',
      message: 'Start is invalid',
    };
    component.issues = [issue];
    component.ngOnChanges({ issues: new SimpleChange([], [issue], false) });
    expect(component.collapsed()).toBe(false);

    component.issues = [];
    component.ngOnChanges({ issues: new SimpleChange([issue], [], false) });
    expect(component.collapsed()).toBe(true);
  });

  it('toggles collapsed state while keeping issue selection available', () => {
    const issue: WorkflowValidationIssue = {
      code: 'START_INVALID',
      severity: 'error',
      nodeId: 'start',
      message: 'Start is invalid',
    };
    component.issues = [issue];
    component.ngOnChanges({ issues: new SimpleChange([], [issue], false) });

    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);

    let selected: WorkflowValidationIssue | null = null;
    component.issueSelected.subscribe((i) => (selected = i));
    component.selectIssue(issue);
    expect(selected).toEqual(issue);
  });
});