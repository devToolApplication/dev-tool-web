import { Route } from '@angular/router';

import { aiAgentAdminRoutes } from './ai-agent.feature';

describe('aiAgentAdminRoutes', () => {
  it('declares title and breadcrumb metadata for routed screens', () => {
    const routes = flattenRoutes(aiAgentAdminRoutes);
    const routedScreens = routes.filter((route) => route.route.component);

    routedScreens.forEach((route) => {
      expect(route.route.data?.['title']).toBeTruthy();
    });

    expect(routes.find((route) => route.path === 'admin/ai-agent/models/create')?.route.data?.['breadcrumb'])
      .toBe('layout.route.create');
    expect(routes.find((route) => route.path === 'admin/ai-agent/models/edit/:id')?.route.data?.['breadcrumb'])
      .toBe('layout.route.edit');
    expect(routes.find((route) => route.path === 'admin/ai-agent/runtime/playground')?.route.data?.['title'])
      .toBe('aiAgent.playground.title');
  });
});

function flattenRoutes(routes: Route[], parentPath = ''): Array<{ path: string; route: Route }> {
  return routes.flatMap((route) => {
    const path = [parentPath, route.path ?? ''].filter(Boolean).join('/');
    const current = { path, route };
    const children = route.children ? flattenRoutes(route.children, path) : [];
    return [current, ...children];
  });
}
