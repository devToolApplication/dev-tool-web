import { Component, OnInit } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { DashboardActivity, DashboardOverview, DashboardTabType } from './dashboard.models';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  activeTab: DashboardTabType = 'ai-agent';

  readonly tabs: DashboardTabType[] = ['ai-agent', 'trade-bot', 'file-storage'];
  readonly tabItems = [
    { value: 'ai-agent', label: 'dashboard.tab.aiAgent' },
    { value: 'trade-bot', label: 'dashboard.tab.tradeBot' },
    { value: 'file-storage', label: 'dashboard.tab.fileStorage' }
  ];

  readonly overviews: Partial<Record<DashboardTabType, DashboardOverview>> = {};
  readonly loadingState: Record<DashboardTabType, boolean> = {
    'ai-agent': false,
    'trade-bot': false,
    'file-storage': false
  };
  readonly errorState: Record<DashboardTabType, string> = {
    'ai-agent': '',
    'trade-bot': '',
    'file-storage': ''
  };

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.tabs.forEach((tab) => this.loadOverview(tab));
  }

  get activeOverview(): DashboardOverview | null {
    return this.overviews[this.activeTab] ?? null;
  }

  get activeActivities(): DashboardActivity[] {
    return this.activeOverview?.activities ?? [];
  }

  get loading(): boolean {
    return this.loadingState[this.activeTab];
  }

  get activeError(): string {
    return this.errorState[this.activeTab];
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

  severityClass(severity: string | undefined): string {
    return `is-${severity || 'info'}`;
  }

  formatTimestamp(value: string | undefined): string {
    if (!value) {
      return '';
    }
    return new Date(value).toLocaleString();
  }

  private loadOverview(tab: DashboardTabType): void {
    this.loadingState[tab] = true;
    this.errorState[tab] = '';
    this.dashboardService
      .getOverview(tab)
      .pipe(
        catchError(() => {
          this.errorState[tab] = 'dashboard.loadError';
          return of(null);
        }),
        finalize(() => {
          this.loadingState[tab] = false;
        })
      )
      .subscribe((overview) => {
        if (overview) {
          this.overviews[tab] = overview;
        }
      });
  }
}
