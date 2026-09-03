import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SdkAdminApiService } from '../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkServiceHealthResponse,
  SdkTaskRunSummary,
} from '../../model/sdk-management.model';
import { SdkManagementComponent } from './sdk-management.component';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('SdkManagementComponent', () => {
  let component: SdkManagementComponent;
  let fixture: ComponentFixture<SdkManagementComponent>;
  let apiService: {
    getServiceHealth: ReturnType<typeof vi.fn>;
    listAgents: ReturnType<typeof vi.fn>;
    checkAgentHealth: ReturnType<typeof vi.fn>;
    listTaskRuns: ReturnType<typeof vi.fn>;
    executeTask: ReturnType<typeof vi.fn>;
    getTaskRunDetail: ReturnType<typeof vi.fn>;
  };

  const mockServiceHealth: SdkServiceHealthResponse = {
    status: 'UP',
    service: 'codex-sdk-api',
    auth: {},
    codex: {},
    database: {},
  };

  const mockAgents: SdkAgentCatalogItem[] = [
    {
      agentCode: 'ba-agent',
      displayName: 'Business Analyst',
      supportedProviders: [],
      requiredDependencies: [],
      health: 'HEALTHY',
    },
  ];

  beforeEach(async () => {
    apiService = {
      getServiceHealth: vi.fn().mockReturnValue(of(mockServiceHealth)),
      listAgents: vi.fn().mockReturnValue(of(mockAgents)),
      checkAgentHealth: vi.fn().mockReturnValue(of({})),
      listTaskRuns: vi.fn().mockReturnValue(of({ items: [], page: 1, size: 20, total: 0 })),
      executeTask: vi.fn().mockReturnValue(of({})),
      getTaskRunDetail: vi.fn().mockReturnValue(of({})),
    };

    await TestBed.configureTestingModule({
      declarations: [SdkManagementComponent, TranslateContentPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: SdkAdminApiService, useValue: apiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load service health and catalog', () => {
    expect(apiService.getServiceHealth).toHaveBeenCalled();
    expect(apiService.listAgents).toHaveBeenCalled();
    expect(component.serviceHealth()).toEqual(mockServiceHealth);
    expect(component.agents()).toEqual(mockAgents);
    expect(component.activeTab()).toBe('catalog');
  });

  it('should switch tabs', () => {
    component.onTabChange('history');
    expect(component.activeTab()).toBe('history');
  });

  it('should navigate to execute tab with prefilled agentCode from catalog', () => {
    component.onRunAgentFromCatalog('dev-fe-agent');
    expect(component.prefilledAgentCode()).toBe('dev-fe-agent');
    expect(component.activeTab()).toBe('execute');
  });

  it('should handle service health check error gracefully', async () => {
    apiService.getServiceHealth.mockReturnValue(throwError(() => new Error('Offline')));
    await component.checkServiceHealth();
    expect(component.serviceHealth()?.status).toBe('DOWN');
  });

  it('should rerun task from history and prefill agentCode', () => {
    const summary: SdkTaskRunSummary = {
      taskId: 't-1',
      agentCode: 'test-qa-agent',
      provider: 'codex',
      status: 'COMPLETED',
      promptPreview: 'run tests',
      createdAt: '2026-09-03',
      updatedAt: '2026-09-03',
    };
    component.onRerunTaskFromHistory(summary);
    expect(component.prefilledAgentCode()).toBe('test-qa-agent');
    expect(component.activeTab()).toBe('execute');
  });
});