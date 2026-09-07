import { Routes } from '@angular/router';
import { CodexThreadListPageComponent } from './pages/codex-thread-list/codex-thread-list.component';

export const codexSdkRoutes: Routes = [
  {
    path: 'codex-sdk/threads',
    component: CodexThreadListPageComponent,
  },
];
