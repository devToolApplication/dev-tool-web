import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    items: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: '/admin/dashboard'
      },
      {
        label: 'Upload Storage',
        icon: 'pi pi-cloud-upload',
        routerLink: '/admin/upload-storage/storage'
      },
      {
        label: 'Component Demo',
        icon: 'pi pi-box',
        items: [
          { label: 'Input Demo', icon: 'pi pi-pencil', routerLink: '/admin/component-demo/input' },
          { label: 'Select Demo', icon: 'pi pi-list', routerLink: '/admin/component-demo/select' },
          { label: 'Button Demo', icon: 'pi pi-stop', routerLink: '/admin/component-demo/button' }
        ]
      },
      {
        label: 'Permissions Demo (403)',
        icon: 'pi pi-lock',
        routerLink: '/403'
      },
      {
        label: 'Missing Page Demo (404)',
        icon: 'pi pi-exclamation-triangle',
        routerLink: '/404'
      },
      {
        label: 'Operations',
        icon: 'pi pi-briefcase',
        items: [
          { label: 'Queue Monitor', icon: 'pi pi-list-check', routerLink: '/reports' },
          { label: 'Scheduler', icon: 'pi pi-calendar-clock', routerLink: '/reports' },
          { label: 'Worker Nodes', icon: 'pi pi-server', routerLink: '/reports' },
          { label: 'Exchange Connectors', icon: 'pi pi-sitemap', routerLink: '/reports' },
          { label: 'Alert Rules', icon: 'pi pi-bell', routerLink: '/reports' },
          { label: 'Webhook Logs', icon: 'pi pi-history', routerLink: '/reports' },
          { label: 'API Keys', icon: 'pi pi-key', routerLink: '/reports' },
          { label: 'System Audit', icon: 'pi pi-book', routerLink: '/reports' },
          { label: 'Backups', icon: 'pi pi-database', routerLink: '/reports' },
          { label: 'Incident Timeline', icon: 'pi pi-clock', routerLink: '/reports' },
          { label: 'Region: APAC', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'Region: EU', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'Region: US', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'Cluster Alpha', icon: 'pi pi-microchip-ai', routerLink: '/reports' },
          { label: 'Cluster Beta', icon: 'pi pi-microchip-ai', routerLink: '/reports' },
          { label: 'Cluster Gamma', icon: 'pi pi-microchip-ai', routerLink: '/reports' }
        ]
      }
    ]
  },
  {
    label: 'Mail',
    icon: 'pi pi-envelope',
    badge: '5',
    items: [
      {
        label: 'Compose',
        icon: 'pi pi-file-edit',
        shortcut: '⌘+N',
        routerLink: '/mail/compose'
      },
      {
        label: 'Inbox',
        icon: 'pi pi-inbox',
        badge: '5',
        routerLink: '/mail/inbox'
      }
    ]
  },
  {
    label: 'Reports',
    icon: 'pi pi-chart-bar',
    shortcut: '⌘+R',
    items: [
      {
        label: 'Sales',
        icon: 'pi pi-chart-line',
        badge: '3',
        routerLink: '/reports'
      },
      {
        label: 'Analytics',
        icon: 'pi pi-chart-scatter',
        items: [
          {
            label: 'Overview',
            icon: 'pi pi-chart-line',
            routerLink: '/reports'
          },
          {
            label: 'Traffic',
            icon: 'pi pi-compass',
            routerLink: '/reports'
          }
        ]
      },
      {
        label: 'Products',
        icon: 'pi pi-list',
        badge: '6',
        routerLink: '/reports'
      }
    ]
  },
  {
    label: 'Profile',
    icon: 'pi pi-user',
    shortcut: '⌘+W',
    items: [
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        shortcut: '⌘+O',
        routerLink: '/settings'
      },
      {
        label: 'Privacy',
        icon: 'pi pi-shield',
        shortcut: '⌘+P',
        routerLink: '/profile'
      }
    ]
  }
];
