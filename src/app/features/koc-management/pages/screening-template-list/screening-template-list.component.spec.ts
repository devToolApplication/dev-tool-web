import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { KocScreeningTemplateSummary } from '../../model/koc-workflow.model';
import { KocWorkflowApiService } from '../../services/koc-workflow-api.service';
import { ScreeningTemplateListComponent } from './screening-template-list.component';

describe('ScreeningTemplateListComponent', () => {
  let fixture: ComponentFixture<ScreeningTemplateListComponent>;
  let component: ScreeningTemplateListComponent;
  let workflowApi: { getScreeningTemplates: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockTemplates: KocScreeningTemplateSummary[] = [
    {
      templateId: 'fashion-screening-rules',
      name: 'Fashion Campaign Rules',
      description: 'Standard screening rules for fashion KOCs.',
      ruleCount: 5,
      active: true,
    },
    {
      templateId: 'tech-gadgets-rules',
      name: 'Tech Gadgets Rules',
      description: 'Stricter rules with benchmark comparison.',
      ruleCount: 8,
      active: false,
    },
  ];

  beforeEach(() => {
    workflowApi = {
      getScreeningTemplates: vi.fn(() => of(mockTemplates)),
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      declarations: [ScreeningTemplateListComponent],
      providers: [
        { provide: KocWorkflowApiService, useValue: workflowApi },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ScreeningTemplateListComponent);
    component = fixture.componentInstance;
  });

  it('loads screening templates on init and displays ruleCount and status', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(workflowApi.getScreeningTemplates).toHaveBeenCalledTimes(1);
    expect(component.templates()).toEqual(mockTemplates);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('does not expose campaign editor navigation', () => {
    expect('useTemplate' in (component as unknown as Record<string, unknown>)).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('handles load error gracefully', async () => {
    workflowApi.getScreeningTemplates.mockReturnValue(throwError(() => new Error('Load failed')));
    component.loadTemplates();
    await fixture.whenStable();

    expect(component.templates()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Load failed');
  });
});
