import { userTaskRoutes } from './user-task.routes';
import { TaskInboxComponent } from './pages/task-inbox/task-inbox.component';
import { TaskHostComponent } from './pages/task-host/task-host.component';

describe('userTaskRoutes', () => {
  it('registers /tasks inbox and /tasks/:taskId host routes', () => {
    const paths = userTaskRoutes.map((route) => route.path);

    expect(paths).toContain('tasks');
    expect(paths).toContain('tasks/:taskId');

    const inboxRoute = userTaskRoutes.find((route) => route.path === 'tasks');
    expect(inboxRoute?.component).toBe(TaskInboxComponent);
    expect(inboxRoute?.title).toBe('userTask.nav.title');

    const hostRoute = userTaskRoutes.find((route) => route.path === 'tasks/:taskId');
    expect(hostRoute?.component).toBe(TaskHostComponent);
    expect(hostRoute?.title).toBe('userTask.nav.title');
  });
});
