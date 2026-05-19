import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BadgeVariant } from '../../shared/ui/data-display/badge/badge.component';
import { KeyValueItem } from '../../shared/ui/data-display/key-value-list/key-value-list.component';
import { ActionToolbarAction } from '../../shared/ui/layout/action-toolbar/action-toolbar.component';
import { DashboardActivity, DashboardMetric, DashboardOverview, DashboardResource, DashboardTabType } from './dashboard.models';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  activeTab: DashboardTabType = 'ai-agent';

  readonly tabs: DashboardTabType[] = ['ai-agent', 'file-storage'];
  readonly tabItems = [
    { value: 'ai-agent', label: 'dashboard.tab.aiAgent' },
    { value: 'file-storage', label: 'dashboard.tab.fileStorage' }
  ];

  readonly overviews: Partial<Record<DashboardTabType, DashboardOverview>> = {};
  readonly loadingState: Record<DashboardTabType, boolean> = {
    'ai-agent': false,
    'file-storage': false
  };
  readonly errorState: Record<DashboardTabType, string> = {
    'ai-agent': '',
    'file-storage': ''
  };

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.tabs.forEach((tab) => this.loadOverview(tab));
    });
  }

  get activeOverview(): DashboardOverview | null {
    return this.overviews[this.activeTab] ?? null;
  }

  get activeActivities(): DashboardActivity[] {
    return this.activeOverview?.activities ?? [];
  }

  get activeResources(): DashboardResource[] {
    return this.activeOverview?.resources ?? [];
  }

  get loading(): boolean {
    return this.loadingState[this.activeTab];
  }

  get activeError(): string {
    return this.errorState[this.activeTab];
  }

  get dashboardActions(): ActionToolbarAction[] {
    return [
      {
        id: 'refresh',
        label: 'dashboard.refresh',
        icon: 'pi pi-refresh',
        variant: 'primary',
        placement: 'primary',
        loading: this.loading,
        disabled: this.loading
      }
    ];
  }

  get quickActions(): ActionToolbarAction[] {
    if (this.activeTab === 'file-storage') {
      return [
        { id: 'storage-repository', label: 'layout.menu.storageRepository', icon: 'pi pi-database', variant: 'primary', placement: 'primary' },
        { id: 'uploaded-files', label: 'layout.menu.uploadedFiles', icon: 'pi pi-file', placement: 'secondary' }
      ];
    }

    return [
      { id: 'ai-playground', label: 'layout.menu.playground', icon: 'pi pi-play-circle', variant: 'primary', placement: 'primary' },
      { id: 'execution-traces', label: 'layout.menu.executionTraces', icon: 'pi pi-history', placement: 'secondary' },
      { id: 'ai-models', label: 'layout.menu.aiModels', icon: 'pi pi-microchip-ai', placement: 'secondary' }
    ];
  }

  get needsAttentionItems(): Array<{ title: string; description?: string; status?: string }> {
    const overview = this.activeOverview;
    if (!overview) {
      return [];
    }

    const importantStatuses = new Set(['warning', 'danger', 'failed', 'error', 'degraded', 'pending']);
    const fromMetrics = overview.metrics
      .filter((metric) => importantStatuses.has(String(metric.severity ?? '').toLowerCase()))
      .map((metric) => ({ title: metric.label, description: String(metric.value ?? ''), status: metric.severity }));
    const fromResources = overview.resources
      .filter((resource) => importantStatuses.has(String(resource.status ?? '').toLowerCase()))
      .map((resource) => ({ title: resource.name, description: resource.description ?? resource.value, status: resource.status }));

    return [...fromMetrics, ...fromResources].slice(0, 6);
  }

  get serviceStatusItems(): KeyValueItem[] {
    const overview = this.activeOverview;
    if (!overview) {
      return [];
    }

    return [
      { label: 'dashboard.service', value: overview.service || '-', type: 'copyable' },
      { label: 'dashboard.generatedAt', value: overview.generatedAt || '-', type: overview.generatedAt ? 'datetime' : 'text' }
    ];
  }

  onTabChange(value: string | number | undefined): void {
    if (typeof value !== 'string') {
      return;
    }

    const nextTab = value as DashboardTabType;
    this.activeTab = nextTab;
    if (!this.overviews[nextTab] && !this.loadingState[nextTab]) {
      this.loadOverview(nextTab);
    }
  }

  refreshActive(): void {
    this.loadOverview(this.activeTab);
  }

  onDashboardAction(action: ActionToolbarAction): void {
    if (action.id === 'refresh') {
      this.refreshActive();
      return;
    }

    const routes: Record<string, string> = {
      'ai-playground': '/admin/ai-agent/runtime/playground',
      'execution-traces': '/admin/ai-agent/execution-traces',
      'ai-models': '/admin/ai-agent/models',
      'storage-repository': '/admin/upload-storage/storage',
      'uploaded-files': '/admin/upload-storage/files'
    };
    const route = routes[action.id];
    if (route) {
      void this.router.navigate([route]);
    }
  }

  metricRouterLink(tab: DashboardTabType, metric: DashboardMetric): string {
    if (tab === 'file-storage') {
      return '/admin/upload-storage/files';
    }

    if (String(metric.severity ?? '').toLowerCase() === 'danger') {
      return '/admin/ai-agent/execution-traces';
    }

    return '/admin/ai-agent/runtime/playground';
  }

  metricVariant(severity: string | undefined): BadgeVariant {
    switch (severity) {
      case 'success':
      case 'info':
      case 'warning':
      case 'danger':
        return severity;
      default:
        return 'default';
    }
  }

  formatTimestamp(value: string | undefined): string {
    if (!value) {
      return '';
    }
    return new Date(value).toLocaleString();
  }

  private loadOverview(tab: DashboardTabType): void {
    this.deferStateUpdate(() => {
      this.loadingState[tab] = true;
      this.errorState[tab] = '';
    });
    this.dashboardService
      .getOverview(tab)
      .pipe(
        catchError(() => {
          this.deferStateUpdate(() => {
            this.errorState[tab] = 'dashboard.loadError';
          });
          return of(null);
        }),
        finalize(() => {
          this.deferStateUpdate(() => {
            this.loadingState[tab] = false;
          });
        })
      )
      .subscribe((overview) => {
        if (overview) {
          this.deferStateUpdate(() => {
            this.overviews[tab] = overview;
          });
        }
      });
  }

  private deferStateUpdate(update: () => void): void {
    setTimeout(() => {
      update();
      this.cdr.markForCheck();
    });
  }
}
