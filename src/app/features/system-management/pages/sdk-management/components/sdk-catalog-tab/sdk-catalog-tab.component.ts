import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { TableConfig } from '@shared/ui/data-display/table/table';
import { SdkAdminApiService } from '../../../../api/sdk-admin-api.service';
import type {
  SdkAgentCatalogItem,
  SdkAgentHealthResponse,
} from '../../../../model/sdk-management.model';

@Component({
  selector: 'app-sdk-catalog-tab',
  standalone: false,
  templateUrl: './sdk-catalog-tab.component.html',
  styleUrl: './sdk-catalog-tab.component.css',
})
export class SdkCatalogTabComponent implements OnInit {
  @Input() agents = signal<SdkAgentCatalogItem[]>([]);
  @Input() isLoading = signal<boolean>(false);
  @Output() runAgent = new EventEmitter<string>();

  readonly selectedHealth = signal<SdkAgentHealthResponse | null>(null);
  readonly isHealthDrawerOpen = signal<boolean>(false);
  readonly isCheckingHealth = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly tableConfig: TableConfig<SdkAgentCatalogItem> = {
    columns: [
      {
        field: 'agentCode',
        header: 'systemManagement.sdkManagement.catalog.col.agentCode',
      },
      {
        field: 'displayName',
        header: 'systemManagement.sdkManagement.catalog.col.displayName',
      },
      {
        field: 'supportedProviders',
        header: 'systemManagement.sdkManagement.catalog.col.providers',
      },
      {
        field: 'requiredDependencies',
        header: 'systemManagement.sdkManagement.catalog.col.dependencies',
      },
      {
        field: 'health',
        header: 'systemManagement.sdkManagement.catalog.col.health',
      },
      {
        field: 'actions',
        header: 'systemManagement.sdkManagement.catalog.col.actions',
        type: 'actions',
        actions: [
          {
            label: 'systemManagement.sdkManagement.catalog.action.testHealth',
            variant: 'outline',
            onClick: (row) => this.onTestHealth(row.agentCode),
          },
          {
            label: 'systemManagement.sdkManagement.catalog.action.runTask',
            variant: 'primary',
            onClick: (row) => this.runAgent.emit(row.agentCode),
          },
        ],
      },
    ],
    emptyTitle: 'systemManagement.sdkManagement.catalog.emptyTitle',
    emptyDescription: 'systemManagement.sdkManagement.catalog.emptyDescription',
  };

  constructor(private readonly api: SdkAdminApiService) {}

  ngOnInit(): void {
    if (this.agents().length === 0) {
      this.loadCatalog();
    }
  }

  async loadCatalog(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const items = await firstValueFrom(this.api.listAgents());
      this.agents.set(items);
    } catch {
      this.errorMessage.set('Could not load agent catalog.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onTestHealth(agentCode: string): Promise<void> {
    this.isCheckingHealth.set(true);
    this.isHealthDrawerOpen.set(true);
    this.selectedHealth.set(null);
    try {
      const res = await firstValueFrom(this.api.checkAgentHealth(agentCode));
      this.selectedHealth.set(res);
    } catch {
      this.selectedHealth.set({
        agentCode,
        provider: 'codex',
        status: 'DEGRADED',
        mcp: [],
      });
    } finally {
      this.isCheckingHealth.set(false);
    }
  }

  closeHealthDrawer(): void {
    this.isHealthDrawerOpen.set(false);
    this.selectedHealth.set(null);
  }
}