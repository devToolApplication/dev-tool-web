import type { KocDashboardData } from '../services/koc-dashboard-api.service';
import { buildKocDashboardMetrics, deriveKocDashboardState } from './koc-dashboard-view.model';

function dashboard(overrides: Partial<KocDashboardData> = {}): KocDashboardData {
  return {
    summary: {
      runningCampaigns: 2,
      acceptedCandidates: 12,
      pendingReviews: 3,
      waitingCandidates: 4,
      activeIncidents: 0,
    },
    campaignProgress: [],
    dependencyHealth: [{ dependencyKey: 'facebook', displayName: 'Facebook', health: 'HEALTHY', affectedAgents: [], affectedProviders: [] }],
    attentionItems: [],
    ...overrides,
  };
}

describe('KOC dashboard view model', () => {
  it('builds the five Phase 2 metrics with drill-down links', () => {
    const metrics = buildKocDashboardMetrics(dashboard());

    expect(metrics.map((metric) => metric.id)).toEqual(['running', 'accepted', 'review', 'waiting', 'incidents']);
    expect(metrics.find((metric) => metric.id === 'review')).toEqual(expect.objectContaining({
      value: 3,
      routerLink: ['/ai-agent-mcrs/koc/reviews'],
      queryParams: { status: 'PENDING' },
    }));
    expect(metrics.find((metric) => metric.id === 'waiting')).toEqual(expect.objectContaining({
      value: 4,
      routerLink: ['/ai-agent-mcrs/koc/candidates'],
      queryParams: { executionStatus: 'WAITING' },
    }));
    expect(metrics.find((metric) => metric.id === 'incidents')).toEqual(expect.objectContaining({
      value: 0,
      routerLink: ['/ai-agent-mcrs/koc/incidents'],
      queryParams: { status: 'OPEN' },
    }));
  });

  it('derives dashboard empty, healthy, incident, partial, error and realtime states', () => {
    expect(deriveKocDashboardState({
      data: dashboard({ summary: { runningCampaigns: 0, acceptedCandidates: 0, pendingReviews: 0, waitingCandidates: 0, activeIncidents: 0 } }),
      realtimeConnected: true,
    }).noCampaigns).toBe(true);

    expect(deriveKocDashboardState({ data: dashboard(), realtimeConnected: true }).healthy).toBe(true);

    expect(deriveKocDashboardState({
      data: dashboard({
        summary: { runningCampaigns: 2, acceptedCandidates: 12, pendingReviews: 3, waitingCandidates: 4, activeIncidents: 1 },
        attentionItems: [{
          incidentId: 'inc-1',
          dependencyKey: 'facebook',
          status: 'OPEN',
          health: 'UNHEALTHY',
          waitingWorkflows: 2,
          affectedCampaigns: 1,
        }],
      }),
      realtimeConnected: true,
    }).activeIncident).toBe(true);

    expect(deriveKocDashboardState({
      data: dashboard({ summary: { runningCampaigns: 1, acceptedCandidates: 2 } as KocDashboardData['summary'] }),
      realtimeConnected: true,
    }).partialMetrics).toBe(true);

    expect(deriveKocDashboardState({ data: null, error: 'Load failed', realtimeConnected: true }).apiError).toBe(true);
    expect(deriveKocDashboardState({ data: dashboard(), realtimeConnected: false }).realtimeDisconnected).toBe(true);
  });
});
