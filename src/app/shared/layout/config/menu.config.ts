import { MenuItem } from 'primeng/api';

export const APP_LAYOUT_MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    routerLink: '/'
  },
  {
    label: 'Management',
    icon: 'pi pi-briefcase',
    items: [
      {
        label: 'Users',
        icon: 'pi pi-users'
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog'
      }
    ]
  }
];
