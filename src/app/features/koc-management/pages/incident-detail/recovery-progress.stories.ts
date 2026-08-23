import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '@shared/shared.module';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import type { KocIncidentDetail, KocRecoveryProgress } from '../../model/koc-incident.model';

interface RecoveryProgressStoryArgs {
  incident: KocIncidentDetail;
  recoveryProgress: KocRecoveryProgress | null;
  loading: boolean;
  error: string | null;
}

const blockedIncident: KocIncidentDetail = {
  incidentId: 'inc-blocked-001',
  dependencyKey: 'facebook-mcp-auth',
  stableErrorCode: 'FB_MCP_AUTH_EXPIRED',
  status: 'BLOCKED',
  health: 'UNHEALTHY',
  waitingWorkflows: 128,
  affectedCampaigns: 4,
  businessImpact: 'All candidate screening tasks requiring Facebook authentication are paused.',
  affectedProviders: ['codex', 'claude'],
  agentCode: 'facebook-discovery',
  provider: 'codex',
};

const recoveringIncident: KocIncidentDetail = {
  incidentId: 'inc-recovering-002',
  dependencyKey: 'facebook-mcp-auth',
  stableErrorCode: 'FB_MCP_AUTH_EXPIRED',
  status: 'RECOVERING',
  health: 'DEGRADED',
  waitingWorkflows: 35,
  affectedCampaigns: 2,
  businessImpact: 'Authentication refreshed. Pending candidate workflows are actively resuming.',
  affectedProviders: ['codex'],
  agentCode: 'facebook-discovery',
  provider: 'codex',
};

const healthyIncident: KocIncidentDetail = {
  incidentId: 'inc-healthy-003',
  dependencyKey: 'facebook-mcp-auth',
  stableErrorCode: 'FB_MCP_AUTH_OK',
  status: 'HEALTHY',
  health: 'HEALTHY',
  waitingWorkflows: 0,
  affectedCampaigns: 0,
  businessImpact: 'All dependent workflows resumed successfully without operator retry intervention.',
  affectedProviders: ['codex', 'claude'],
  agentCode: 'facebook-discovery',
  provider: 'codex',
};

const activeRecoveryProgress: KocRecoveryProgress = {
  recovered: 93,
  running: 15,
  queued: 20,
  failed: 0,
};

const meta: Meta<RecoveryProgressStoryArgs> = {
  title: 'Features/KOC Management/Pages/Incident Recovery Progress',
  decorators: [
    moduleMetadata({
      declarations: [StatusBadgeComponent],
      imports: [SharedModule],
    }),
  ],
  render: (args) => {
    const impactItems = [
      { label: 'koc.incident.detail.dependencyKey', value: args.incident.dependencyKey },
      { label: 'koc.incident.detail.errorCode', value: args.incident.stableErrorCode },
      { label: 'koc.incident.detail.waitingWorkflows', value: args.incident.waitingWorkflows },
      { label: 'koc.incident.detail.affectedCampaigns', value: args.incident.affectedCampaigns },
    ];
    const recoveryItems = args.recoveryProgress
      ? [
          { key: 'recovered', label: 'koc.incidentDetail.recovery.recovered', value: args.recoveryProgress.recovered },
          { key: 'running', label: 'koc.incidentDetail.recovery.running', value: args.recoveryProgress.running },
          { key: 'queued', label: 'koc.incidentDetail.recovery.queued', value: args.recoveryProgress.queued },
          { key: 'failed', label: 'koc.incidentDetail.recovery.failed', value: args.recoveryProgress.failed },
        ]
      : [];

    return {
      props: {
        ...args,
        impactItems,
        recoveryItems,
      },
      template: `
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 960px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--app-border); padding-bottom: 12px;">
            <div>
              <h2 style="margin: 0; font-size: var(--app-font-size-lg); color: var(--app-text);">{{ 'koc.incidents.detail.title' | translateContent }}</h2>
              <p style="margin: 4px 0 0; color: var(--app-text-muted); font-size: var(--app-font-size-sm);">{{ 'koc.incidents.detail.subtitle' | translateContent }}</p>
            </div>
            <div style="display: flex; gap: 8px;">
              <app-button
                type="button"
                variant="secondary"
                icon="pi pi-refresh"
                label="koc.incidentDetail.action.testDependency"
              ></app-button>
              <app-button
                type="button"
                icon="pi pi-check"
                label="koc.incidentDetail.action.markIssueFixed"
              ></app-button>
            </div>
          </div>

          @if (loading) {
            <app-loading-skeleton type="detail" [rows]="8"></app-loading-skeleton>
          } @else if (error) {
            <app-error-state
              title="koc.incidentDetail.error.title"
              [message]="error"
              retryLabel="retry"
            ></app-error-state>
          } @else {
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
              <app-section-panel title="koc.incidents.detail.sectionTitle">
                <app-key-value-list [items]="impactItems" layout="one-column"></app-key-value-list>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <app-koc-status-badge [status]="incident.status" size="sm"></app-koc-status-badge>
                  <app-koc-status-badge [status]="incident.health" size="sm"></app-koc-status-badge>
                </div>
              </app-section-panel>

              <app-section-panel title="koc.incidents.detail.subtitle">
                <p style="margin: 0 0 12px; color: var(--app-text); font-size: var(--app-font-size-sm);">{{ incident.businessImpact }}</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  @for (provider of incident.affectedProviders; track provider) {
                    <app-badge [label]="provider" variant="warning" size="sm"></app-badge>
                  }
                </div>
              </app-section-panel>
            </div>

            @if (recoveryProgress) {
              <app-section-panel
                title="koc.incidentDetail.recovery.title"
                subtitle="koc.incidentDetail.recovery.subtitle"
              >
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 8px;">
                  @for (item of recoveryItems; track item.key) {
                    <div style="background: var(--app-surface-soft); border: 1px solid var(--app-border); border-radius: var(--app-radius-md); padding: 12px;">
                      <div style="font-size: var(--app-font-size-xs); color: var(--app-text-muted);">{{ item.label | translateContent }}</div>
                      <strong style="font-size: var(--app-font-size-xl); color: var(--app-text);">{{ item.value }}</strong>
                    </div>
                  }
                </div>
              </app-section-panel>
            }
          }
        </div>
      `,
    };
  },
};

export default meta;

type Story = StoryObj<RecoveryProgressStoryArgs>;

export const BlockedState: Story = {
  args: {
    incident: blockedIncident,
    recoveryProgress: null,
    loading: false,
    error: null,
  },
};

export const RecoveringWithProgress: Story = {
  args: {
    incident: recoveringIncident,
    recoveryProgress: activeRecoveryProgress,
    loading: false,
    error: null,
  },
};

export const HealthyResolvedState: Story = {
  args: {
    incident: healthyIncident,
    recoveryProgress: {
      recovered: 128,
      running: 0,
      queued: 0,
      failed: 0,
    },
    loading: false,
    error: null,
  },
};

export const LoadingState: Story = {
  args: {
    incident: blockedIncident,
    recoveryProgress: null,
    loading: true,
    error: null,
  },
};

export const ErrorState: Story = {
  args: {
    incident: blockedIncident,
    recoveryProgress: null,
    loading: false,
    error: 'koc.incidentDetail.error.loadFailed',
  },
};