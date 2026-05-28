import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { BadgeVariant } from '../../shared/ui/data-display/badge/badge.component';
import { StatusListItem } from '../../shared/ui/data-display/status-list/status-list.component';
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
  readonly activeTab = signal<DashboardTabType>('ai-agent');

  readonly tabs: DashboardTabType[] = ['ai-agent', 'file-storage'];
  readonly tabItems = [
    { value: 'ai-agent', label: 'dashboard.tab.aiAgent' },
    { value: 'file-storage', label: 'dashboard.tab.fileStorage' }
  ];

  readonly overviews = signal<Partial<Record<DashboardTabType, DashboardOverview>>>({});
  readonly loadingState = signal<Record<DashboardTabType, boolean>>({
    'ai-agent': false,
    'file-storage': false
  });
  readonly errorState = signal<Record<DashboardTabType, string>>({
    'ai-agent': '',
    'file-storage': ''
  });

  readonly activeOverview = computed(() => this.overviews()[this.activeTab()] ?? null);
  readonly activeActivities = computed<DashboardActivity[]>(() => this.activeOverview()?.activities ?? []);
  readonly activeResources = computed<DashboardResource[]>(() => this.activeOverview()?.resources ?? []);
  readonly loading = computed(() => this.loadingState()[this.activeTab()]);
  readonly activeError = computed(() => this.errorState()[this.activeTab()]);

  readonly dashboardActions = computed<ActionToolbarAction[]>(() => [
    {
      id: 'refresh',
      label: 'dashboard.refresh',
      icon: 'pi pi-refresh',
      variant: 'primary',
      placement: 'primary',
      loading: this.loading(),
      disabled: this.loading()
    }
  ]);

  readonly quickActions = computed<ActionToolbarAction[]>(() => {
    if (this.activeTab() === 'file-storage') {
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
  });

  readonly needsAttentionItems = computed<StatusListItem[]>(() => {
    const overview = this.activeOverview();
    if (!overview) {
      return [];
    }

    const importantStatuses = new Set(['warning', 'danger', 'failed', 'error', 'degraded', 'pending']);
    const fromMetrics = overview.metrics
      .filter((metric) => importantStatuses.has(String(metric.severity ?? '').toLowerCase()))
      .map((metric) => ({
        title: metric.label,
        description: String(metric.value ?? ''),
        status: metric.severity,
        statusVariant: this.metricVariant(metric.severity)
      }));
    const fromResources = overview.resources
      .filter((resource) => importantStatuses.has(String(resource.status ?? '').toLowerCase()))
      .map((resource) => ({
        title: resource.name,
        description: resource.description ?? resource.value,
        status: resource.status,
        statusVariant: this.metricVariant(resource.status)
      }));

    return [...fromMetrics, ...fromResources].slice(0, 6);
  });

  readonly serviceStatusItems = computed<StatusListItem[]>(() => {
    const overview = this.activeOverview();
    if (!overview) {
      return [];
    }

    return [
      { title: 'dashboard.service', value: overview.service || '-' },
      { title: 'dashboard.generatedAt', value: overview.generatedAt || '-' }
    ];
  });

  readonly activityItems = computed<StatusListItem[]>(() =>
    this.activeActivities().map((activity) => ({
      title: activity.title,
      description: activity.description,
      status: activity.status,
      statusVariant: this.metricVariant(activity.status),
      timestamp: activity.timestamp
    }))
  );

  readonly resourceItems = computed<StatusListItem[]>(() =>
    this.activeResources().map((resource) => ({
      title: resource.name,
      description: resource.description,
      status: resource.status,
      statusVariant: this.metricVariant(resource.status),
      value: resource.value
    }))
  );

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.tabs.forEach((tab) => this.loadOverview(tab));
  }

  onTabChange(value: string | number | undefined): void {
    if (typeof value !== 'string') {
      return;
    }

    const nextTab = value as DashboardTabType;
    this.activeTab.set(nextTab);
    if (!this.overviews()[nextTab] && !this.loadingState()[nextTab]) {
      this.loadOverview(nextTab);
    }
  }

  refreshActive(): void {
    this.loadOverview(this.activeTab());
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
    this.loadingState.update((state) => ({ ...state, [tab]: true }));
    this.errorState.update((state) => ({ ...state, [tab]: '' }));

    this.dashboardService
      .getOverview(tab)
      .pipe(
        catchError(() => {
          this.errorState.update((state) => ({ ...state, [tab]: 'dashboard.loadError' }));
          return of(null);
        }),
        finalize(() => {
          this.loadingState.update((state) => ({ ...state, [tab]: false }));
        })
      )
      .subscribe((overview) => {
        if (overview) {
          this.overviews.update((state) => ({ ...state, [tab]: overview }));
        }
      });
  }
}
