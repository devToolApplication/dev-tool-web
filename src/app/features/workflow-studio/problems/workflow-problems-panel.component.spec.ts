import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';

import { WorkflowValidationIssue } from '../model/workflow-studio.model';
import { WorkflowProblemsPanelComponent } from './workflow-problems-panel.component';
import { WorkflowEditorStore } from '../store/workflow-editor.store';

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
      providers: [WorkflowEditorStore],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowProblemsPanelComponent);
    component = fixture.componentInstance;
  });

  it('renders only a compact header when there are no issues', () => {
    component.issues = [];

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workflow-problems__count')?.textContent).toContain(
      '0',
    );
    expect(fixture.nativeElement.querySelector('.workflow-problems__toggle')).toBeNull();
    expect(fixture.nativeElement.querySelector('#workflow-problems-list')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('workflowStudio.problems.empty');
  });

  it('renders validation issue references and emits selected issue', () => {
    const selected: WorkflowValidationIssue[] = [];
    component.issues = [
      {
        code: 'AI_GATE_INSTRUCTION_REQUIRED',
        severity: 'error',
        nodeId: 'ai',
        field: 'instruction',
        message: 'AI instruction is required',
      },
    ];
    component.issueSelected.subscribe((issue) => selected.push(issue));

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.workflow-problems__button').click();

    expect(fixture.nativeElement.textContent).toContain('AI instruction is required');
    expect(fixture.nativeElement.textContent).toContain('ai');
    expect(fixture.nativeElement.textContent).toContain('instruction');
    expect(selected[0]).toEqual(component.issues[0]);
  });

  it('selects the referenced node through the editor store when clicked', () => {
    const store = TestBed.inject(WorkflowEditorStore);
    store.loadWorkflow({
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: null,
        status: 'DRAFT',
        currentDraftVersionId: 'ver-1',
        currentPublishedVersionId: null,
      },
      versions: [
        {
          id: 'ver-1',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'DRAFT',
          definition: {
            nodes: [
              { id: 'start', type: 'START' },
              { id: 'end', type: 'END' },
            ],
            edges: [{ source: 'start', target: 'end' }],
          },
          runtime: { maxParallel: 1 },
          compiledPlan: null,
        },
      ],
    });
    component.issues = [
      {
        code: 'START_INVALID',
        severity: 'error',
        nodeId: 'start',
        message: 'Start is invalid',
      },
    ];

    fixture.detectChanges();
    fixture.nativeElement.querySelector('.workflow-problems__button').click();

    expect(store.selectedNodeId()).toBe('start');
    expect(store.focusedValidationIssue()).toMatchObject({ nodeId: 'start' });
  });

  it('toggles collapsed state while keeping issue selection available', () => {
    const store = TestBed.inject(WorkflowEditorStore);
    store.loadWorkflow({
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: null,
        status: 'DRAFT',
        currentDraftVersionId: 'ver-1',
        currentPublishedVersionId: null,
      },
      versions: [
        {
          id: 'ver-1',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'DRAFT',
          definition: {
            nodes: [
              { id: 'start', type: 'START' },
              { id: 'end', type: 'END' },
            ],
            edges: [{ source: 'start', target: 'end' }],
          },
          runtime: { maxParallel: 1 },
          compiledPlan: null,
        },
      ],
    });
    const issue: WorkflowValidationIssue = {
      code: 'START_INVALID',
      severity: 'error',
      nodeId: 'start',
      message: 'Start is invalid',
    };
    component.issues = [issue];

    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);

    component.selectIssue(issue);
    expect(store.selectedNodeId()).toBe('start');
  });
});
