export type DashboardTabType = 'ai-agent' | 'trade-bot' | 'file-storage';

export interface DashboardMetric {
  key: string;
  label: string;
  value: string;
  unit?: string;
  trendLabel?: string;
  severity?: DashboardSeverity;
}

export interface DashboardChartSeries {
  key: string;
  title: string;
  type: 'line' | 'bar';
  labels: string[];
  values: number[];
}

export interface DashboardActivity {
  title: string;
  description?: string;
  status?: string;
  timestamp?: string;
}

export interface DashboardResource {
  name: string;
  description?: string;
  status?: string;
  value?: string;
}

export interface DashboardOverview {
  service: string;
  generatedAt?: string;
  metrics: DashboardMetric[];
  charts: DashboardChartSeries[];
  activities: DashboardActivity[];
  resources: DashboardResource[];
}

export type DashboardSeverity = 'success' | 'info' | 'warning' | 'danger' | string;
