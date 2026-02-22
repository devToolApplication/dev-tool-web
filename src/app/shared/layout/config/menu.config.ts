import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'Mail',
    icon: 'pi pi-envelope',
    badge: '5',
    items: [
      {
        label: 'Compose',
        icon: 'pi pi-file-edit',
        shortcut: '⌘+N',
        routerLink: '/mail'
      },
      {
        label: 'Inbox',
        icon: 'pi pi-inbox',
        badge: '5',
        routerLink: '/mail'
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
