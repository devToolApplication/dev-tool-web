import { Routes } from '@angular/router';
import { TaskInboxComponent } from './pages/task-inbox/task-inbox.component';
import { TaskHostComponent } from './pages/task-host/task-host.component';

export const userTaskRoutes: Routes = [
  {
    path: 'tasks',
    component: TaskInboxComponent,
    title: 'userTask.nav.title',
  },
  {
    path: 'tasks/:taskId',
    component: TaskHostComponent,
    title: 'userTask.nav.title',
  },
];
