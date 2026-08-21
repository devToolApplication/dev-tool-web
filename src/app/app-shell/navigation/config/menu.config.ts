import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.aiAgentMcrs',
    icon: 'pi pi-microchip-ai',
    groupColor: 'var(--app-primary)',
    items: [
      {
        label: 'layout.menu.aiAgentMcrsSecrets',
        icon: 'pi pi-key',
        routerLink: '/ai-agent-mcrs/secrets',
      },
      {
        label: 'layout.menu.aiAgentMcrsConfigs',
        icon: 'pi pi-sliders-h',
        routerLink: '/ai-agent-mcrs/configs',
      },
    ],
  },
  {
    label: 'layout.menu.jobService',
    icon: 'pi pi-briefcase',
    groupColor: 'var(--app-chart-success)',
    items: [
      {
        label: 'layout.menu.jobServiceSecrets',
        icon: 'pi pi-key',
        routerLink: '/job-service/secrets',
      },
      {
        label: 'layout.menu.jobServiceConfigs',
        icon: 'pi pi-cog',
        routerLink: '/job-service/configs',
      },
      {
        label: 'layout.menu.jobManagement',
        icon: 'pi pi-calendar-clock',
        routerLink: '/job-service/jobs',
      },
    ],
  },
];
