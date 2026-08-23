import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowDefinition } from '../model/workflow-studio.model';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';
import { WorkflowListPageComponent } from './workflow-list-page.component';

describe('WorkflowListPageComponent', () => {
  let fixture: ComponentFixture<WorkflowListPageComponent>;
  let component: WorkflowListPageComponent;
  let api: {
    getWorkflowPage: ReturnType<typeof vi.fn>;
    publishWorkflow: ReturnType<typeof vi.fn>;
    startWorkflow: ReturnType<typeof vi.fn>;
    getWorkflowDetail: ReturnType<typeof vi.fn>;
  };
  let persistence: { publishDetail: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const workflow: WorkflowDefinition = {
    id: 'wf-1',
    name: 'KOC screening',
    description: null,
    status: 'DRAFT',
    currentDraftVersionId: 'ver-2',
    currentPublishedVersionId: 'ver-1',
  };

  beforeEach(() => {
    api = {
      getWorkflowPage: vi.fn(() => of(createBasePageResponse([workflow], 0, 20, 1))),
      publishWorkflow: vi.fn(() => of({ definition: workflow, versions: [] })),
      startWorkflow: vi.fn(() => of({
        id: 'run-1',
        workflowDefinitionId: 'wf-1',
        workflowVersionId: 'ver-1',
        status: 'PENDING',
        input: {},
        startedAt: null,
        completedAt: null,
        finalOutcome: null,
        finalOutput: null,
        nodes: [],
      })),
      getWorkflowDetail: vi.fn(() => of({
        definition: workflow,
        versions: [],
      })),
    };
    persistence = {
      publishDetail: vi.fn(() => Promise.resolve({ definition: workflow, versions: [] })),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [WorkflowListPageComponent],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: WorkflowPersistenceService, useValue: persistence },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(WorkflowListPageComponent);
    component = fixture.componentInstance;
  });

  it('loads the workflow list on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getWorkflowPage).toHaveBeenCalledWith({ page: 0, size: 20, sort: ['name,asc'] });
    expect(component.workflows()).toEqual([workflow]);
    expect(component.totalRecords()).toBe(1);
  });

  it('opens the builder when a workflow row is clicked', () => {
    component.openBuilder(workflow);

    expect(router.navigate).toHaveBeenCalledWith([workflow.id, 'edit'], { relativeTo: TestBed.inject(ActivatedRoute) });
  });

  it('starts a run and navigates to run detail after JSON input is submitted', async () => {
    component.openRunDialog(workflow);

    await component.startRun({ profile: { id: 'koc-1' } });

    expect(api.startWorkflow).toHaveBeenCalledWith('wf-1', { profile: { id: 'koc-1' } });
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflow-runs', 'run-1']);
  });

  it('publishes from the list through the validation persistence boundary', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.publishWorkflow(workflow);

    expect(api.getWorkflowDetail).toHaveBeenCalledWith('wf-1');
    expect(persistence.publishDetail).toHaveBeenCalledWith({ definition: workflow, versions: [] });
    expect(api.publishWorkflow).not.toHaveBeenCalled();
  });
});
