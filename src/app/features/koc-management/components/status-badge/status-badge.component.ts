import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type { KocCampaignStatus } from '../../model/koc-campaign.model';
import type {
  KocBusinessDecision,
  KocExecutionStatus,
  KocHealthStatus,
} from '../../model/koc-common.model';
import type { KocEvidenceState } from '../../model/koc-evidence.model';
import type { KocIncidentStatus } from '../../model/koc-incident.model';
import type { KocReviewStatus } from '../../model/koc-review.model';

export type KocStatusBadgeInput =
  | KocBusinessDecision
  | KocExecutionStatus
  | KocHealthStatus
  | KocCampaignStatus
  | KocEvidenceState
  | KocIncidentStatus
  | KocReviewStatus
  | 'ACTIVE'
  | 'DISABLED'
  | 'UNKNOWN';

export interface KocStatusBadgeConfig {
  label: string;
  variant: BadgeVariant;
  icon: string;
}

export function statusBadgeForKocStatus(
  status: KocStatusBadgeInput | string | null | undefined,
): KocStatusBadgeConfig {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'koc.candidate.status.accepted', variant: 'success', icon: 'pi pi-check-circle' };
    case 'REJECTED':
      return { label: 'koc.candidate.status.rejected', variant: 'danger', icon: 'pi pi-times-circle' };
    case 'REVIEW':
      return { label: 'koc.candidate.status.review', variant: 'warning', icon: 'pi pi-flag' };
    case 'SCREENING':
      return { label: 'koc.candidate.status.screening', variant: 'info', icon: 'pi pi-sync' };
    case 'WAITING':
      return { label: 'koc.candidate.status.waiting', variant: 'muted', icon: 'pi pi-clock' };
    case 'WAITING_DEPENDENCY':
      return {
        label: 'koc.execution.status.waitingDependency',
        variant: 'warning',
        icon: 'pi pi-link',
      };
    case 'RUNNING':
    case 'ACTIVE':
      return { label: 'koc.status.running', variant: 'info', icon: 'pi pi-play-circle' };
    case 'COMPLETED':
    case 'HEALTHY':
    case 'RESOLVED':
      return { label: 'koc.status.healthy', variant: 'success', icon: 'pi pi-check-circle' };
    case 'DEGRADED':
    case 'RECOVERING':
    case 'PENDING':
      return { label: 'koc.status.needsAttention', variant: 'warning', icon: 'pi pi-exclamation-triangle' };
    case 'UNHEALTHY':
    case 'FAILED':
    case 'BLOCKED':
    case 'OPEN':
      return { label: 'koc.status.blocked', variant: 'danger', icon: 'pi pi-ban' };
    case 'DRAFT':
    case 'READY':
      return { label: 'koc.status.ready', variant: 'muted', icon: 'pi pi-file' };
    case 'PAUSED':
    case 'STOPPED':
    case 'CANCELLED':
    case 'DISABLED':
      return { label: 'koc.status.disabled', variant: 'muted', icon: 'pi pi-pause-circle' };
    case 'FOUND':
      return { label: 'koc.evidence.state.found', variant: 'success', icon: 'pi pi-search' };
    case 'NOT_FOUND':
      return { label: 'koc.evidence.state.notFound', variant: 'muted', icon: 'pi pi-minus-circle' };
    case 'INSUFFICIENT':
      return { label: 'koc.evidence.state.insufficient', variant: 'warning', icon: 'pi pi-question-circle' };
    case 'FETCH_ERROR':
      return { label: 'koc.evidence.state.fetchError', variant: 'danger', icon: 'pi pi-cloud-download' };
    case 'UNSUPPORTED':
      return { label: 'koc.evidence.state.unsupported', variant: 'muted', icon: 'pi pi-ban' };
    default:
      return { label: 'koc.status.unknown', variant: 'muted', icon: 'pi pi-question-circle' };
  }
}

@Component({
  selector: 'app-koc-status-badge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  @Input() status: KocStatusBadgeInput | string | null | undefined = 'UNKNOWN';
  @Input() size: 'sm' | 'md' = 'md';

  get badge(): KocStatusBadgeConfig {
    return statusBadgeForKocStatus(this.status);
  }
}
