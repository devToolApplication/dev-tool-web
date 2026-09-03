import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkAgentHealthResponse,
} from '../../../../model/sdk-management.model';
import { SdkCatalogTabComponent } from './sdk-catalog-tab.component';
import { SharedModule } from '@shared/shared.module';

describe('SdkCatalogTabComponent', () => {
  let component: SdkCatalogTabComponent;
  let fixture: ComponentFixture<SdkCatalogTabComponent>;
  let apiSpy: jasmine.SpyObj<SdkAdminApiService>;

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
    apiSpy = jasmine.createSpyObj('SdkAdminApiService', ['listAgents', 'checkAgentHealth']);
    apiSpy.listAgents.and.returnValue(of(mockAgents));
    apiSpy.checkAgentHealth.and.returnValue(of(mockHealth));

    await TestBed.configureTestingModule({
      declarations: [SdkCatalogTabComponent],
      imports: [SharedModule],
      providers: [{ provide: SdkAdminApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdkCatalogTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load catalog on init if empty', () => {
    expect(apiSpy.listAgents).toHaveBeenCalled();
    expect(component.agents()).toEqual(mockAgents);
    expect(component.isLoading()).toBeFalse();
  });

  it('should test health and open drawer', async () => {
    await component.onTestHealth('ba-agent');
    expect(apiSpy.checkAgentHealth).toHaveBeenCalledWith('ba-agent');
    expect(component.selectedHealth()).toEqual(mockHealth);
    expect(component.isHealthDrawerOpen()).toBeTrue();
  });

  it('should handle test health error gracefully', async () => {
    apiSpy.checkAgentHealth.and.returnValue(throwError(() => new Error('Server error')));
    await component.onTestHealth('ba-agent');
    expect(component.selectedHealth()?.status).toBe('DEGRADED');
    expect(component.isHealthDrawerOpen()).toBeTrue();
  });

  it('should emit runAgent on runTask action', () => {
    spyOn(component.runAgent, 'emit');
    const actionsCol = component.tableConfig.columns.find((c) => c.field === 'actions');
    const runAction = actionsCol?.actions?.find((a) => a.variant === 'primary');
    runAction?.onClick(mockAgents[0]);
    expect(component.runAgent.emit).toHaveBeenCalledWith('ba-agent');
  });

  it('should close health drawer and reset state', () => {
    component.isHealthDrawerOpen.set(true);
    component.selectedHealth.set(mockHealth);
    component.closeHealthDrawer();
    expect(component.isHealthDrawerOpen()).toBeFalse();
    expect(component.selectedHealth()).toBeNull();
  });
});