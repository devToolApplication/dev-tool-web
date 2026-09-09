import { APP_LAYOUT_MENU } from './menu.config';

describe('APP_LAYOUT_MENU', () => {
  it('exposes AI Agent MCRS, Account Management, Job Service and User Task entries', () => {
    const groups = APP_LAYOUT_MENU.map((item) => item.label);

    expect(groups).toContain('layout.menu.aiAgentMcrs');
    expect(groups).toContain('layout.menu.accountManagement');
    expect(groups).toContain('layout.menu.kocManagement');
    expect(groups).toContain('layout.menu.jobService');
    expect(groups).toContain('userTask.nav.title');

    expect(flattenRoutes()).toEqual(
      expect.arrayContaining([
        '/ai-agent-mcrs/secrets',
        '/ai-agent-mcrs/configs',
        '/ai-agent-mcrs/workflows',
        '/accounts',
        '/koc/campaigns',
        '/job-service/secrets',
        '/job-service/configs',
        '/job-service/jobs',
        '/tasks',
      ]),
    );
    expect(flattenRoutes()).not.toContain('/koc/approval');
  });

  function flattenRoutes(): string[] {
    const routes: string[] = [];
    const visit = (items = APP_LAYOUT_MENU): void => {
      items.forEach((item) => {
        if (typeof item.routerLink === 'string') {
          routes.push(item.routerLink);
        }
        if (item.items?.length) {
          visit(item.items);
        }
      });
    };

    visit();
    return routes;
  }
});
