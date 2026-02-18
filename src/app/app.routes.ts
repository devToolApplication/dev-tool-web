import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { demoRouter } from './features/demo/demo-routing.module';
import { mailRoutes } from './features/mail/mail-routing.module';
import { reportsRoutes } from './features/reports/reports-routing.module';
import { profileRoutes } from './features/profile/profile-routing.module';

const routes: Routes = [
  ...mailRoutes,
  ...reportsRoutes,
  ...profileRoutes,
  ...demoRouter,
  { path: '**', redirectTo: 'mail' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutes {}
