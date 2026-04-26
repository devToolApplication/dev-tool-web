import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { demoRouter } from './features/demo/demo-routing.module';
import { settingsRoutes } from './features/settings/settings-routing.module';
import { dashboardRoutes } from './features/dashboard/dashboard-routing.module';
import { errorRoutes } from './features/error/error-routing.module';
import { aiAgentAdminRoutes } from './features/admin/ai-agent/ai-agent.feature';
import { fileStorageRoutes } from './features/admin/file-storage-management/file-storage-management.feature';
import { systemManagementRoutes } from './features/admin/system-management/system-management.feature';
import { tradeBotRoutes } from './features/admin/trade-bot-management/trade-bot-management.feature';
import { FeaturePlaceholderComponent } from './features/feature-placeholder/feature-placeholder.component';

const routes: Routes = [
  ...settingsRoutes,
  ...demoRouter,
  ...dashboardRoutes,
  ...aiAgentAdminRoutes,
  ...fileStorageRoutes,
  ...systemManagementRoutes,
  ...tradeBotRoutes,
  ...errorRoutes,
  { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutes {}
