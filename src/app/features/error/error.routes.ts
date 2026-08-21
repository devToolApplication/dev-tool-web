import { Routes } from '@angular/router';
import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const errorRoutes: Routes = [
  { path: '403', component: ForbiddenComponent },
  { path: '404', component: NotFoundComponent }
];
