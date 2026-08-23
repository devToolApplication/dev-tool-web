import type { Params } from '@angular/router';
import type { KocDashboardData } from '../services/koc-dashboard-api.service';

export type KocDashboardMetricId = 'running' | 'accepted' | 'review' | 'waiting' | 'incidents';

export interface KocDashboardMetric {
  id: KocDashboardMetricId;
  label: string;
  value: number | null;
  routerLink?: readonly string[];
  queryParams?: Params;
  trendVariant?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
}

export interface KocDashboardStateInput {
  data: KocDashboardData | null | undefined;
  loading?: boolean;
  error?: string | null;
  realtimeConnected?: boolean;
}

export interface KocDashboardViewState {
  loading: boolean;
  apiError: boolean;
  noCampaigns: boolean;
  healthy: boolean;
  activeIncident: boolean;
  partialMetrics: boolean;
  realtimeDisconnected: boolean;
}

const METRIC_DEFINITIONS: Array<Omit<KocDashboardMetric, 'value'>> = [
  { id: 'running', label: 'koc.dashboard.metric.running', trendVariant: 'info' },
  { id: 'accepted', label: 'koc.dashboard.metric.accepted', trendVariant: 'success' },
  {
    id: 'review',
    label: 'koc.dashboard.metric.review',
    routerLink: ['/ai-agent-mcrs/koc/reviews'],
    queryParams: { status: 'PENDING' },
    trendVariant: 'warning',
  },
  {
    id: 'waiting',
    label: 'koc.dashboard.metric.waiting',
    routerLink: ['/ai-agent-mcrs/koc/candidates'],
    queryParams: { executionStatus: 'WAITING' },
    trendVariant: 'warning',
  },
  {
    id: 'incidents',
    label: 'koc.dashboard.metric.incidents',
    routerLink: ['/ai-agent-mcrs/koc/incidents'],
    queryParams: { status: 'OPEN' },
    trendVariant: 'danger',
  },
];

export function buildKocDashboardMetrics(data: KocDashboardData | null | undefined): KocDashboardMetric[] {
  const summary = data?.summary;
  const values: Record<KocDashboardMetricId, number | null> = {
    running: finiteMetric(summary?.runningCampaigns),
    accepted: finiteMetric(summary?.acceptedCandidates),
    review: finiteMetric(summary?.pendingReviews),
    waiting: finiteMetric(summary?.waitingCandidates),
    incidents: finiteMetric(summary?.activeIncidents),
  };

  return METRIC_DEFINITIONS.map((metric) => ({
    ...metric,
    value: values[metric.id],
  }));
}

export function deriveKocDashboardState(input: KocDashboardStateInput): KocDashboardViewState {
  const metrics = buildKocDashboardMetrics(input.data);
  const running = metrics.find((metric) => metric.id === 'running')?.value ?? 0;
  const accepted = metrics.find((metric) => metric.id === 'accepted')?.value ?? 0;
  const review = metrics.find((metric) => metric.id === 'review')?.value ?? 0;
  const waiting = metrics.find((metric) => metric.id === 'waiting')?.value ?? 0;
  const incidents = metrics.find((metric) => metric.id === 'incidents')?.value ?? 0;
  const partialMetrics = metrics.some((metric) => metric.value === null);
  const hasHealthyDependencies = (input.data?.dependencyHealth ?? []).every(
    (dependency) => dependency.health === 'HEALTHY',
  );

  return {
    loading: input.loading === true,
    apiError: !!input.error,
    noCampaigns: !!input.data && running === 0 && accepted === 0 && review === 0 && waiting === 0 && incidents === 0,
    healthy: !!input.data && incidents === 0 && (input.data.attentionItems ?? []).length === 0 && hasHealthyDependencies,
    activeIncident: incidents > 0 || (input.data?.attentionItems ?? []).some((item) => item.status === 'OPEN' || item.status === 'BLOCKED'),
    partialMetrics,
    realtimeDisconnected: input.realtimeConnected === false,
  };
}

function finiteMetric(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
