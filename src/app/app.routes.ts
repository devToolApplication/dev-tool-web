import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { demoRouter } from './features/demo/demo-routing.module';
import { mailRoutes } from './features/mail/mail-routing.module';
import { reportsRoutes } from './features/reports/reports-routing.module';
import { profileRoutes } from './features/profile/profile-routing.module';
import { settingsRoutes } from './features/settings/settings-routing.module';
import { dashboardRoutes } from './features/dashboard/dashboard-routing.module';
import { errorRoutes } from './features/error/error-routing.module';
import { aiAgentRoutes } from './features/ai-agent/ai-agent-routing.module';
import { fileStorageRoutes } from './features/admin/file-storage/file-storage.feature';
import { mcpServerRoutes } from './features/admin/mcp-server/mcp-server.feature';
import { systemManagementRoutes } from './features/admin/system-management/system-management.feature';
import { tradeBotRoutes } from './features/admin/trade-bot/trade-bot.feature';
import { FeaturePlaceholderComponent } from './features/feature-placeholder/feature-placeholder.component';

const routes: Routes = [
  ...mailRoutes,
  ...reportsRoutes,
  ...profileRoutes,
  ...settingsRoutes,
  ...demoRouter,
  ...dashboardRoutes,
  ...fileStorageRoutes,
  ...aiAgentRoutes,
  ...mcpServerRoutes,
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
