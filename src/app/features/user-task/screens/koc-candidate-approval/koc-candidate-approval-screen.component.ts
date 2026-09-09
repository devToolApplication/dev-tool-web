import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { TaskScreenAdapter } from '../../models/task-screen-adapter.model';
import {
  KocCandidateApprovalContent,
  KocCandidateApprovalItem,
  UserTaskSummary,
} from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-koc-candidate-approval-screen',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-section-panel [title]="'userTask.kocApproval.title' | translateContent">
        <app-key-value-list [items]="campaignItems()" layout="two-column"></app-key-value-list>
      </app-section-panel>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm font-medium text-[var(--app-text)]">
          {{ 'userTask.kocApproval.selectedCount' | translateContent }}:
          {{ selectedIds().size }}/{{ candidates().length }}
        </span>
        <div class="flex flex-wrap gap-2">
          <app-button
            variant="secondary"
            icon="pi pi-check-square"
            [label]="'userTask.kocApproval.selectAll' | translateContent"
            (buttonClick)="selectAllQualified()"
          ></app-button>
          <app-button
            variant="ghost"
            icon="pi pi-times"
            [label]="'userTask.kocApproval.deselectAll' | translateContent"
            (buttonClick)="deselectAll()"
          ></app-button>
        </div>
      </div>

      <app-table
        [config]="tableConfig"
        [data]="candidates()"
        [customTemplates]="{
          selected: selectedTemplate,
          candidate: candidateTemplate,
          notes: notesTemplate
        }"
      ></app-table>

      <ng-template #selectedTemplate let-row="row">
        <app-check-box
          [value]="selectedIds().has(row.externalProfileId)"
          [hideLabel]="true"
          [ariaLabel]="row.fullName"
          (valueChange)="setSelected(row.externalProfileId, $event)"
        ></app-check-box>
      </ng-template>

      <ng-template #candidateTemplate let-row="row">
        <div class="min-w-0">
          <a
            class="font-medium text-[var(--app-link)] hover:underline"
            [href]="row.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="row.fullName"
          >
            {{ row.fullName }}
          </a>
          <div class="text-xs text-[var(--app-text-muted)]">{{ row.platform }}</div>
        </div>
      </ng-template>

      <ng-template #notesTemplate let-row="row">
        <div class="space-y-1 text-xs">
          @if (row.strengths.length) {
            <div class="text-[var(--app-control-success-text)]">{{ row.strengths.join(', ') }}</div>
          }
          @if (row.risks.length) {
            <div class="text-[var(--app-control-danger-text)]">{{ row.risks.join(', ') }}</div>
          }
          @if (row.reviewNote) {
            <div class="text-[var(--app-text-muted)]">{{ row.reviewNote }}</div>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export class KocCandidateApprovalScreenComponent
  implements OnInit, OnDestroy, TaskScreenAdapter
{
  private readonly store = inject(TaskHostStore);
  private readonly contentState = signal<KocCandidateApprovalContent | null>(null);

  @Input() task?: UserTaskSummary;
  @Input()
  set content(value: KocCandidateApprovalContent | null | undefined) {
    this.contentState.set(value ?? null);
    this.selectedIds.set(
      new Set(
        value?.candidates
          .filter((candidate) => candidate.score >= value.minScore)
          .map((candidate) => candidate.externalProfileId) ?? [],
      ),
    );
  }

  readonly selectedIds = signal(new Set<string>());
  readonly candidates = computed(() => this.contentState()?.candidates ?? []);
  readonly campaignItems = computed<KeyValueItem[]>(() => {
    const content = this.contentState();
    if (!content) return [];
    return [
      { label: 'userTask.taskInfo.businessKey', value: content.campaignId, copyable: true },
      { label: 'userTask.column.workflow', value: content.campaignName },
      { label: 'userTask.kocApproval.targetCount', value: content.targetCount, type: 'number' },
      { label: 'userTask.kocApproval.minScore', value: content.minScore, type: 'number' },
    ];
  });

  readonly tableConfig: TableConfig<KocCandidateApprovalItem> = {
    columns: [
      { field: 'selected', header: '', type: 'custom', width: '3rem', hideable: false },
      {
        field: 'candidate',
        header: 'userTask.kocApproval.colCandidate',
        type: 'custom',
        minWidth: '12rem',
        hideable: false,
      },
      {
        field: 'followerCount',
        header: 'userTask.kocApproval.colFollowers',
        type: 'number',
        width: '9rem',
      },
      {
        field: 'engagementRate',
        header: 'userTask.kocApproval.colEngagement',
        type: 'number',
        suffix: '%',
        width: '8rem',
      },
      {
        field: 'score',
        header: 'userTask.kocApproval.colScore',
        type: 'number',
        width: '7rem',
      },
      {
        field: 'notes',
        header: 'userTask.kocApproval.colNotes',
        type: 'custom',
        minWidth: '12rem',
      },
    ],
    rowKey: 'externalProfileId',
    pagination: false,
    minWidth: '48rem',
  };

  ngOnInit(): void {
    this.store.registerAdapter(this);
  }

  ngOnDestroy(): void {
    this.store.unregisterAdapter(this);
  }

  setSelected(candidateId: string, selected: boolean | null): void {
    const next = new Set(this.selectedIds());
    if (selected) next.add(candidateId);
    else next.delete(candidateId);
    this.selectedIds.set(next);
  }

  selectAllQualified(): void {
    const content = this.contentState();
    if (!content) return;
    this.selectedIds.set(
      new Set(
        content.candidates
          .filter((candidate) => candidate.score >= content.minScore)
          .map((candidate) => candidate.externalProfileId),
      ),
    );
  }

  deselectAll(): void {
    this.selectedIds.set(new Set());
  }

  validate(action: string): boolean | string {
    return action !== 'APPROVE' || this.selectedIds().size > 0
      ? true
      : 'userTask.kocApproval.selectAtLeastOne';
  }

  buildVariables(action: string): Record<string, unknown> {
    return action === 'APPROVE'
      ? { approvedCandidateIds: [...this.selectedIds()] }
      : {};
  }
}
