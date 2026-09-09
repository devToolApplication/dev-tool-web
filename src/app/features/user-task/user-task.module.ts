import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { TaskInboxComponent } from './pages/task-inbox/task-inbox.component';
import { TaskHostComponent } from './pages/task-host/task-host.component';
import { TaskShellComponent } from './components/task-shell/task-shell.component';
import { TaskActionBarComponent } from './components/task-action-bar/task-action-bar.component';
import { UnsupportedTaskScreenComponent } from './components/unsupported-task-screen/unsupported-task-screen.component';
import { KocCandidateApprovalScreenComponent } from './screens/koc-candidate-approval/koc-candidate-approval-screen.component';
import { KocDiscoveryDecisionScreenComponent } from './screens/koc-discovery-decision/koc-discovery-decision-screen.component';
import { Manual2faConfirmationScreenComponent } from './screens/manual-2fa-confirmation/manual-2fa-confirmation-screen.component';
import { GenericApprovalScreenComponent } from './screens/generic-approval/generic-approval-screen.component';

const COMPONENTS = [
  TaskInboxComponent,
  TaskHostComponent,
  TaskShellComponent,
  TaskActionBarComponent,
  UnsupportedTaskScreenComponent,
  KocCandidateApprovalScreenComponent,
  KocDiscoveryDecisionScreenComponent,
  Manual2faConfirmationScreenComponent,
  GenericApprovalScreenComponent,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
  ],
  exports: [...COMPONENTS],
})
export class UserTaskModule {}