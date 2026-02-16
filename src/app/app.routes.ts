import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { demoRouter } from './features/demo/demo-routing.module';

const routes: Routes = [
  ...demoRouter
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutes { }
