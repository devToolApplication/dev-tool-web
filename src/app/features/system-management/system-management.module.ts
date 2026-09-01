import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';

@NgModule({
  declarations: [SdkTaskConsoleComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule],
})
export class SystemManagementModule {}
