import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkAgentHealthResponse,
} from '../../../../model/sdk-management.model';
import { SdkCatalogTabComponent } from './sdk-catalog-tab.component';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('SdkCatalogTabComponent', () => {
  let component: SdkCatalogTabComponent;
  let fixture: ComponentFixture<SdkCatalogTabComponent>;
  let apiService: {
    listAgents: ReturnType<typeof vi.fn>;
    checkAgentHealth: ReturnType<typeof vi.fn>;
  };

  const mockAgents: SdkAgentCatalogItem[] = [
    {
      agentCode: 'ba-agent',
      displayName: 'Business Analyst',
      defaultProvider: 'codex',
      supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
      requiredDependencies: ['mcp-git'],
      health: 'HEALTHY',
    },
  ];

  const mockHealth: SdkAgentHealthResponse = {
    agentCode: 'ba-agent',
    provider: 'codex',
    status: 'READY',
    mcp: [
      {
        name: 'mcp-git',
        status: 'UP',
        configured: true,
        required: true,
        requiredTools: ['status'],
        missingTools: [],
        toolCount: 2,
        latencyMs: 15,
      },
    ],
  };

  beforeEach(async () => {
    apiService = {
      listAgents: vi.fn().mockReturnValue(of(mockAgents)),
      checkAgentHealth: vi.fn().mockReturnValue(of(mockHealth)),
    };

    await TestBed.configureTestingModule({
      declarations: [SdkCatalogTabComponent, TranslateContentPipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: SdkAdminApiService, useValue: apiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkCatalogTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load catalog on init if empty', () => {
    expect(apiService.listAgents).toHaveBeenCalled();
    expect(component.agents()).toEqual(mockAgents);
    expect(component.isLoading()).toBeFalsy();
  });

  it('should test health and open drawer', async () => {
    await component.onTestHealth('ba-agent');
    expect(apiService.checkAgentHealth).toHaveBeenCalledWith('ba-agent');
    expect(component.selectedHealth()).toEqual(mockHealth);
    expect(component.isHealthDrawerOpen()).toBeTruthy();
  });

  it('should handle test health error gracefully', async () => {
    apiService.checkAgentHealth.mockReturnValue(throwError(() => new Error('Server error')));
    await component.onTestHealth('ba-agent');
    expect(component.selectedHealth()?.status).toBe('DEGRADED');
    expect(component.isHealthDrawerOpen()).toBeTruthy();
  });

  it('should emit runAgent on runTask action', () => {
    const emitSpy = vi.spyOn(component.runAgent, 'emit');
    const actionsCol = component.tableConfig.columns.find((col) => col.field === 'actions');
    const runAction = actionsCol?.actions?.find((act) => act.variant === 'primary');
    runAction?.onClick(mockAgents[0]);
    expect(emitSpy).toHaveBeenCalledWith('ba-agent');
  });

  it('should close health drawer and reset state', () => {
    component.isHealthDrawerOpen.set(true);
    component.selectedHealth.set(mockHealth);
    component.closeHealthDrawer();
    expect(component.isHealthDrawerOpen()).toBeFalsy();
    expect(component.selectedHealth()).toBeNull();
  });
});