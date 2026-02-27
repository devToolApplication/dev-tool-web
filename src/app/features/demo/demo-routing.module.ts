import { Routes } from '@angular/router';
import { DemoComponent } from './demo.component';

export const demoRouter: Routes = [
  { path: 'admin/component-demo', pathMatch: 'full', redirectTo: 'admin/component-demo/input' },
  { path: 'admin/component-demo/:section', component: DemoComponent }
];
