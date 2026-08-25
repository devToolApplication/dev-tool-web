import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';

import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { TimelineItem } from '@shared/ui/data-display/timeline/timeline.component';
import type { KocCandidateDetail } from '../../model/koc-candidate.model';
import type { KocEvidenceItem } from '../../model/koc-evidence.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { KocRealtimeService } from '../../services/koc-realtime.service';

@Component({
  selector: 'app-koc-candidate-detail',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './candidate-detail.component.html',
  styleUrl: './candidate-detail.component.css',
})
export class CandidateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(KocCandidateApiService);
  private readonly realtime = inject(KocRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly candidateId = signal(this.route.snapshot.paramMap.get('candidateId') ?? '');
  readonly candidate = signal<KocCandidateDetail | null>(null);
  readonly evidence = signal<KocEvidenceItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedEvidence = signal<KocEvidenceItem | null>(null);
  readonly evidenceDrawerOpen = signal(false);

  readonly selectedEvidenceDetails = computed<KeyValueItem[]>(() => {
    const item = this.selectedEvidence();
    if (!item) {
      return [];
    }
    return [
      {
        label: 'koc.evidence.drawer.businessFact',
        value: item.excerpt ?? item.coverage ?? 'notAvailable',
      },
      { label: 'koc.evidence.drawer.sourceType', value: item.sourceType },
      { label: 'koc.evidence.drawer.observedAt', value: item.observedAt, type: 'datetime' },
      { label: 'koc.evidence.drawer.coverage', value: item.coverage ?? 'notAvailable' },
      { label: 'koc.evidence.drawer.agent', value: item.agentCode ?? 'notAvailable' },
      { label: 'koc.evidence.drawer.provider', value: item.provider ?? 'notAvailable' },
    ];
  });

  readonly selectedEvidenceExecutionDetails = computed<KeyValueItem[]>(() => {
    const item = this.selectedEvidence();
    if (!item) {
      return [];
    }
    return [
      { label: 'koc.evidence.drawer.agent', value: item.agentCode ?? 'notAvailable' },
      { label: 'koc.evidence.drawer.provider', value: item.provider ?? 'notAvailable' },
      {
        label: 'koc.evidence.drawer.executionPolicy',
        value: 'koc.campaignWizard.screening.infrastructureWait',
      },
    ];
  });

  readonly workflowTimeline = computed<TimelineItem[]>(() => [
    timelineItem('discovery', 'completed'),
    timelineItem('cheapFilter', 'completed'),
    timelineItem('basicResearch', this.evidence().length ? 'completed' : 'queued'),
    timelineItem('rules', this.candidate()?.screeningProgress === 100 ? 'completed' : 'running'),
    timelineItem(
      'engagementResearch',
      this.candidate()?.executionStatus === 'RUNNING' ? 'running' : 'queued',
    ),
    timelineItem('finalize', this.candidate()?.decision === 'SCREENING' ? 'queued' : 'completed'),
  ]);

  ngOnInit(): void {
    void this.loadCandidate();
    this.connectRealtime();
  }

  async loadCandidate(): Promise<void> {
    const candidateId = this.candidateId();
    if (!candidateId) {
      this.error.set('koc.candidateDetail.error.missingCandidate');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        forkJoin({
          candidate: this.api.getCandidate(candidateId),
          evidence: this.api.getEvidence(candidateId),
        }),
      );
      this.candidate.set(response.candidate);
      this.evidence.set(response.evidence);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  openEvidence(item: KocEvidenceItem): void {
    this.selectedEvidence.set(item);
    this.evidenceDrawerOpen.set(true);
  }

  closeEvidence(): void {
    this.evidenceDrawerOpen.set(false);
  }

  primaryDecisionLabel(): string {
    const decision = this.candidate()?.decision ?? 'SCREENING';
    return `koc.candidate.status.${decision.toLowerCase()}`;
  }

  evidenceStateLabel(item: KocEvidenceItem): string {
    return `koc.evidence.state.${evidenceStateKey(item.state)}`;
  }

  evidenceStateVariant(item: KocEvidenceItem): BadgeVariant {
    switch (item.state) {
      case 'FOUND':
        return 'success';
      case 'INSUFFICIENT':
        return 'warning';
      case 'FETCH_ERROR':
        return 'danger';
      case 'NOT_FOUND':
      case 'UNKNOWN':
      case 'UNSUPPORTED':
      default:
        return 'muted';
    }
  }

  evidenceAriaLabel(item: KocEvidenceItem): string {
    const fact = item.excerpt || item.coverage || 'notAvailable';
    return `${this.evidenceStateLabel(item)} - ${this.evidenceCoverageLabel(item)} - ${fact}`;
  }

  evidenceCoverageLabel(item: KocEvidenceItem): string {
    if (item.state === 'FETCH_ERROR') {
      return 'koc.evidence.coverage.infrastructureUnknown';
    }
    if (item.state === 'NOT_FOUND') {
      return 'koc.evidence.coverage.noMatchFound';
    }
    return item.coverage ?? 'notAvailable';
  }

  private connectRealtime(): void {
    this.realtime
      .connect({ reconnect: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.aggregateId === this.candidateId()) {
          void this.loadCandidate();
        }
      });
  }
}

function evidenceStateKey(state: KocEvidenceItem['state']): string {
  switch (state) {
    case 'NOT_FOUND':
      return 'notFound';
    case 'FETCH_ERROR':
      return 'fetchError';
    default:
      return state.toLowerCase();
  }
}

function timelineItem(
  id: 'discovery' | 'cheapFilter' | 'basicResearch' | 'rules' | 'engagementResearch' | 'finalize',
  status: 'queued' | 'running' | 'completed',
): TimelineItem {
  return {
    id,
    title: `koc.workflow.step.${id}`,
    description: `koc.workflow.status.${status}`,
    variant: status === 'completed' ? 'success' : status === 'running' ? 'warning' : 'muted',
    icon:
      status === 'completed'
        ? 'pi pi-check-circle'
        : status === 'running'
          ? 'pi pi-sync'
          : 'pi pi-clock',
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.candidateDetail.error.loadFailed';
}
