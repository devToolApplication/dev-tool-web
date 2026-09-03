import { Routes } from '@angular/router';
import { AccountListComponent } from './pages/account-list/account-list.component';

export const accountManagementRoutes: Routes = [
  {
    path: 'accounts',
    component: AccountListComponent,
  },
];
