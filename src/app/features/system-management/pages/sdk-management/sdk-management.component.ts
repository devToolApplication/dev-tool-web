import { Component, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { AppTabItem } from '@shared/ui/primitives/tabs/tabs.component';
import { SdkAdminApiService } from '../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkServiceHealthResponse,
  SdkTaskRunSummary,
} from '../../model/sdk-management.model';

@Component({
  selector: 'app-sdk-management',
  standalone: false,
  templateUrl: './sdk-management.component.html',
  styleUrl: './sdk-management.component.css',
})
export class SdkManagementComponent implements OnInit {
  readonly activeTab = signal<string>('catalog');
  readonly serviceHealth = signal<SdkServiceHealthResponse | null>(null);
  readonly isCheckingHealth = signal<boolean>(false);

  readonly agents = signal<SdkAgentCatalogItem[]>([]);
  readonly isLoadingCatalog = signal<boolean>(false);
  readonly prefilledAgentCode = signal<string | null>(null);

  readonly tabs: AppTabItem[] = [
    {
      value: 'catalog',
      label: 'systemManagement.sdkManagement.tabs.catalog',
    },
    {
      value: 'execute',
      label: 'systemManagement.sdkManagement.tabs.execute',
    },
    {
      value: 'history',
      label: 'systemManagement.sdkManagement.tabs.history',
    },
  ];

  constructor(private readonly api: SdkAdminApiService) {}

  ngOnInit(): void {
    this.checkServiceHealth();
    this.loadCatalog();
  }

  async checkServiceHealth(): Promise<void> {
    this.isCheckingHealth.set(true);
    try {
      const res = await firstValueFrom(this.api.getServiceHealth());
      this.serviceHealth.set(res);
    } catch {
      this.serviceHealth.set({
        status: 'DOWN',
        service: 'codex-sdk-api',
        auth: {},
        codex: {},
        database: {},
      });
    } finally {
      this.isCheckingHealth.set(false);
    }
  }

  async loadCatalog(): Promise<void> {
    this.isLoadingCatalog.set(true);
    try {
      const list = await firstValueFrom(this.api.listAgents());
      this.agents.set(list);
    } catch {
      this.agents.set([]);
    } finally {
      this.isLoadingCatalog.set(false);
    }
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onRunAgentFromCatalog(agentCode: string): void {
    this.prefilledAgentCode.set(agentCode);
    this.activeTab.set('execute');
  }

  onRerunTaskFromHistory(run: SdkTaskRunSummary): void {
    this.prefilledAgentCode.set(run.agentCode);
    this.activeTab.set('execute');
  }

  onTaskExecuted(_summary: SdkTaskRunSummary): void {
    // Keep user on execute tab to view output
  }
}