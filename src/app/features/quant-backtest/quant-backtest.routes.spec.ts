import { describe, expect, it } from 'vitest';
import { quantBacktestRoutes } from './quant-backtest.routes';
import { RunsOverviewComponent } from './pages/runs-overview/runs-overview.component';
import { RunCreateComponent } from './pages/run-create/run-create.component';
import { RunDetailComponent } from './pages/run-detail/run-detail.component';
import { StrategiesComponent } from './pages/strategies/strategies.component';

describe('quantBacktestRoutes', () => {
  it('defines the quant-backtest root path with expected child routes', () => {
    expect(quantBacktestRoutes.length).toBe(1);
    const root = quantBacktestRoutes[0];
    expect(root?.path).toBe('quant-backtest');
    expect(root?.children).toBeDefined();

    const children = root?.children ?? [];
    const paths = children.map((c) => c.path);

    expect(paths).toContain('');
    expect(paths).toContain('runs');
    expect(paths).toContain('runs/create');
    expect(paths).toContain('runs/:runId');
    expect(paths).toContain('strategies');
  });

  it('redirects root empty path to runs', () => {
    const root = quantBacktestRoutes[0];
    const emptyRoute = root?.children?.find((c) => c.path === '');
    expect(emptyRoute?.redirectTo).toBe('runs');
    expect(emptyRoute?.pathMatch).toBe('full');
  });

  it('maps child routes to correct feature components', () => {
    const root = quantBacktestRoutes[0];
    const children = root?.children ?? [];

    const runsRoute = children.find((c) => c.path === 'runs');
    expect(runsRoute?.component).toBe(RunsOverviewComponent);

    const createRoute = children.find((c) => c.path === 'runs/create');
    expect(createRoute?.component).toBe(RunCreateComponent);

    const detailRoute = children.find((c) => c.path === 'runs/:runId');
    expect(detailRoute?.component).toBe(RunDetailComponent);

    const strategiesRoute = children.find((c) => c.path === 'strategies');
    expect(strategiesRoute?.component).toBe(StrategiesComponent);
  });
});
