import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';
import { SdkManagementComponent } from './pages/sdk-management/sdk-management.component';
import { SdkCatalogTabComponent } from './pages/sdk-management/components/sdk-catalog-tab/sdk-catalog-tab.component';
import { SdkExecuteTabComponent } from './pages/sdk-management/components/sdk-execute-tab/sdk-execute-tab.component';
import { SdkHistoryTabComponent } from './pages/sdk-management/components/sdk-history-tab/sdk-history-tab.component';

@NgModule({
  declarations: [
    SdkTaskConsoleComponent,
    SdkManagementComponent,
    SdkCatalogTabComponent,
    SdkExecuteTabComponent,
    SdkHistoryTabComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
  exports: [SdkManagementComponent],
})
export class SystemManagementModule {}