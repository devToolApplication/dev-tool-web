import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';
import { SdkExecuteTabComponent } from './sdk-execute-tab.component';
import { SharedModule } from '@shared/shared.module';

describe('SdkExecuteTabComponent', () => {
  let component: SdkExecuteTabComponent;
  let fixture: ComponentFixture<SdkExecuteTabComponent>;
  let apiSpy: jasmine.SpyObj<SdkAdminApiService>;

  const mockAgents: SdkAgentCatalogItem[] = [
    {
      agentCode: 'ba-agent',
      displayName: 'Business Analyst',
      defaultProvider: 'codex',
      supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
      requiredDependencies: [],
      health: 'HEALTHY',
    },
  ];

  const mockSummary: SdkTaskRunSummary = {
    taskId: 'task-100',
    agentCode: 'ba-agent',
    provider: 'codex',
    status: 'RUNNING',
    promptPreview: 'Hello world',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-03T00:00:00Z',
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('SdkAdminApiService', ['executeTask']);
    apiSpy.executeTask.and.returnValue(of(mockSummary));

    await TestBed.configureTestingModule({
      declarations: [SdkExecuteTabComponent],
      imports: [SharedModule],
      providers: [{ provide: SdkAdminApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkExecuteTabComponent);
    component = fixture.componentInstance;
    component.agents = mockAgents;
    fixture.detectChanges();
  });

  it('should initialize with default agent if available', () => {
    expect(component.form().agentCode).toBe('ba-agent');
    expect(component.agentOptions.length).toBe(1);
  });

  it('should load sample template', () => {
    component.onLoadSample();
    expect(component.form().prompt).toContain('Summarize candidate');
    expect(component.form().outputSchemaText).toContain('passed');
  });

  it('should reset form', () => {
    component.onLoadSample();
    component.onReset();
    expect(component.form().prompt).toBe('');
    expect(component.form().outputSchemaText).toBe('');
  });

  it('should validate required fields', async () => {
    component.form.set({ ...component.form(), agentCode: '', prompt: '' });
    await component.onSubmit();
    expect(component.errorMessage()).toContain('required');
    expect(apiSpy.executeTask).not.toHaveBeenCalled();
  });

  it('should validate invalid JSON in output schema', async () => {
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test', outputSchemaText: '{ invalid' });
    await component.onSubmit();
    expect(component.errorMessage()).toContain('JSON');
    expect(apiSpy.executeTask).not.toHaveBeenCalled();
  });

  it('should submit task and emit event', async () => {
    spyOn(component.taskExecuted, 'emit');
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test' });
    await component.onSubmit();

    expect(apiSpy.executeTask).toHaveBeenCalled();
    expect(component.executionResult()).toEqual(mockSummary);
    expect(component.taskExecuted.emit).toHaveBeenCalledWith(mockSummary);
  });

  it('should handle API execution error', async () => {
    apiSpy.executeTask.and.returnValue(throwError(() => new Error('Execution fail')));
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test' });
    await component.onSubmit();

    expect(component.errorMessage()).toContain('Failed to execute');
  });
});