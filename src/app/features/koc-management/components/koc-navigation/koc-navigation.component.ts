import { ChangeDetectionStrategy, Component } from '@angular/core';

interface KocNavigationItem {
  label: string;
  icon: string;
  routerLink: string;
  exact: boolean;
}

@Component({
  selector: 'app-koc-navigation',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './koc-navigation.component.html',
  styleUrl: './koc-navigation.component.css',
})
export class KocNavigationComponent {
  readonly items: KocNavigationItem[] = [
    {
      label: 'koc.navigation.overview',
      icon: 'pi pi-chart-line',
      routerLink: '/ai-agent-mcrs/koc/dashboard',
      exact: true,
    },
    {
      label: 'koc.navigation.campaigns',
      icon: 'pi pi-briefcase',
      routerLink: '/ai-agent-mcrs/koc/campaigns',
      exact: false,
    },
    {
      label: 'koc.navigation.candidates',
      icon: 'pi pi-users',
      routerLink: '/ai-agent-mcrs/koc/candidates',
      exact: false,
    },
    {
      label: 'koc.navigation.reviews',
      icon: 'pi pi-flag',
      routerLink: '/ai-agent-mcrs/koc/reviews',
      exact: false,
    },
    {
      label: 'koc.navigation.incidents',
      icon: 'pi pi-exclamation-triangle',
      routerLink: '/ai-agent-mcrs/koc/incidents',
      exact: false,
    },
    {
      label: 'koc.navigation.configuration',
      icon: 'pi pi-cog',
      routerLink: '/ai-agent-mcrs/koc/configuration/agents',
      exact: false,
    },
  ];
}
