import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkTaskRunSummary,
} from '../../../../model/sdk-management.model';
import { SdkExecuteTabComponent } from './sdk-execute-tab.component';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('SdkExecuteTabComponent', () => {
  let component: SdkExecuteTabComponent;
  let fixture: ComponentFixture<SdkExecuteTabComponent>;
  let apiService: {
    executeTask: ReturnType<typeof vi.fn>;
  };

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
    apiService = {
      executeTask: vi.fn().mockReturnValue(of(mockSummary)),
    };

    await TestBed.configureTestingModule({
      declarations: [SdkExecuteTabComponent, TranslateContentPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: SdkAdminApiService, useValue: apiService }],
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
    expect(apiService.executeTask).not.toHaveBeenCalled();
  });

  it('should validate invalid JSON in output schema', async () => {
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test', outputSchemaText: '{ invalid' });
    await component.onSubmit();
    expect(component.errorMessage()).toContain('JSON');
    expect(apiService.executeTask).not.toHaveBeenCalled();
  });

  it('should submit task and emit event', async () => {
    const emitSpy = vi.spyOn(component.taskExecuted, 'emit');
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test' });
    await component.onSubmit();

    expect(apiService.executeTask).toHaveBeenCalled();
    expect(component.executionResult()).toEqual(mockSummary);
    expect(emitSpy).toHaveBeenCalledWith(mockSummary);
  });

  it('should handle API execution error', async () => {
    apiService.executeTask.mockReturnValue(throwError(() => new Error('Execution fail')));
    component.form.set({ ...component.form(), agentCode: 'ba-agent', prompt: 'test' });
    await component.onSubmit();

    expect(component.errorMessage()).toContain('Failed to execute');
  });
});