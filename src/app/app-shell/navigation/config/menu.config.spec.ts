import { APP_LAYOUT_MENU } from './menu.config';

describe('APP_LAYOUT_MENU', () => {
  it('exposes AI Agent MCRS, Account Management and Job Service entries', () => {
    const groups = APP_LAYOUT_MENU.map((item) => item.label);

    expect(groups).toContain('layout.menu.aiAgentMcrs');
    expect(groups).toContain('layout.menu.accountManagement');
    expect(groups).toContain('layout.menu.jobService');

    expect(flattenRoutes()).toEqual(
      expect.arrayContaining([
        '/ai-agent-mcrs/secrets',
        '/ai-agent-mcrs/configs',
        '/ai-agent-mcrs/workflows',
        '/accounts',
        '/job-service/secrets',
        '/job-service/configs',
        '/job-service/jobs',
      ]),
    );
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
