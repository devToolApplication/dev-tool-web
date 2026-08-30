import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { KocWorkflowTemplateSummary } from '../../model/koc-workflow.model';
import { KocWorkflowApiService } from '../../services/koc-workflow-api.service';
import { WorkflowTemplateListComponent } from './workflow-template-list.component';

describe('WorkflowTemplateListComponent', () => {
  let fixture: ComponentFixture<WorkflowTemplateListComponent>;
  let component: WorkflowTemplateListComponent;
  let workflowApi: { getWorkflowTemplates: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockTemplates: KocWorkflowTemplateSummary[] = [
    {
      templateId: 'standard-discovery-screening',
      name: 'Standard Discovery & Screening',
      description: 'Standard end-to-end pipeline template.',
      active: true,
    },
    {
      templateId: 'fast-screening',
      name: 'Fast Screening Only',
      description: 'Screening only workflow.',
      active: false,
    },
  ];

  beforeEach(() => {
    workflowApi = {
      getWorkflowTemplates: vi.fn(() => of(mockTemplates)),
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      declarations: [WorkflowTemplateListComponent],
      providers: [
        { provide: KocWorkflowApiService, useValue: workflowApi },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(WorkflowTemplateListComponent);
    component = fixture.componentInstance;
  });

  it('loads workflow templates on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(workflowApi.getWorkflowTemplates).toHaveBeenCalledTimes(1);
    expect(component.templates()).toEqual(mockTemplates);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('does not expose campaign editor navigation', () => {
    expect('useTemplate' in (component as unknown as Record<string, unknown>)).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('handles load error gracefully', async () => {
    workflowApi.getWorkflowTemplates.mockReturnValue(throwError(() => new Error('Load failed')));
    component.loadTemplates();
    await fixture.whenStable();

    expect(component.templates()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Load failed');
  });
});
