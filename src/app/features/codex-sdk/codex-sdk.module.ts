import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@shared/shared.module';

import { codexSdkRoutes } from './codex-sdk.routes';
import { CodexChatDrawerComponent } from './components/codex-chat-drawer/codex-chat-drawer.component';
import { CodexThreadListPageComponent } from './pages/codex-thread-list/codex-thread-list.component';

@NgModule({
  declarations: [CodexThreadListPageComponent, CodexChatDrawerComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(codexSdkRoutes),
    SharedModule,
  ],
  exports: [CodexThreadListPageComponent, CodexChatDrawerComponent],
})
export class CodexSdkModule {}
