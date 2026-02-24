import { Component } from '@angular/core';
import { finalize } from 'rxjs';
import { DashboardItem, DashboardTabType } from './dashboard.models';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  activeTab: DashboardTabType | undefined;
  loading = false;
  items: DashboardItem[] = [];

  constructor(private readonly dashboardService: DashboardService) {}

  onTabChange(value: string | number | undefined): void {
    if (typeof value !== "string") {
      return;
    }

    const nextTab = value as DashboardTabType;

    this.activeTab = nextTab;
    this.loading = true;

    this.dashboardService
      .getDashboardItems(nextTab)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((items) => {
        this.items = items;
      });
  }
}
