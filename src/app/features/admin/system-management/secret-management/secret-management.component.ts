import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-secret-management',
  standalone: false,
  templateUrl: './secret-management.component.html'
})
export class SecretManagementComponent implements OnInit {
  readonly activeTab = signal('ai-agent');

  readonly tabs = [
    { label: 'layout.menu.aiAgentPlatform', value: 'ai-agent' },
    { label: 'layout.menu.tradeBotManagement', value: 'trade-bot' },
    { label: 'layout.menu.fileStorageManagement', value: 'file-storage' },
    { label: 'layout.menu.jobScheduler', value: 'jobs' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab && this.tabs.some((t) => t.value === tab)) {
        this.activeTab.set(tab);
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }
}
