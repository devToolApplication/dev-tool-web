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
  KocCandidatePreviewItem,
  KocDiscoveryDecisionContent,
  UserTaskSummary,
} from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-koc-discovery-decision-screen',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-section-panel [title]="'userTask.kocDecision.title' | translateContent">
        <app-key-value-list [items]="progressItems()" layout="two-column"></app-key-value-list>
      </app-section-panel>

      <app-section-panel [title]="'userTask.kocDecision.previewTitle' | translateContent">
        <app-table
          [config]="tableConfig"
          [data]="preview()"
          [customTemplates]="{ candidate: candidateTemplate }"
        ></app-table>
      </app-section-panel>

      <ng-template #candidateTemplate let-row="row">
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
      </ng-template>
    </div>
  `,
})
export class KocDiscoveryDecisionScreenComponent
  implements OnInit, OnDestroy, TaskScreenAdapter
{
  private readonly store = inject(TaskHostStore);
  private readonly contentState = signal<KocDiscoveryDecisionContent | null>(null);

  @Input() task?: UserTaskSummary;
  @Input()
  set content(value: KocDiscoveryDecisionContent | null | undefined) {
    this.contentState.set(value ?? null);
  }

  readonly preview = computed(() => this.contentState()?.candidatePreview.slice(0, 10) ?? []);
  readonly progressItems = computed<KeyValueItem[]>(() => {
    const content = this.contentState();
    if (!content) return [];
    return [
      { label: 'userTask.taskInfo.businessKey', value: content.campaignId, copyable: true },
      { label: 'userTask.column.workflow', value: content.campaignName },
      { label: 'userTask.kocDecision.roundProgress', value: content.currentRound, type: 'number' },
      { label: 'userTask.kocDecision.roundLimit', value: content.roundLimit, type: 'number' },
      { label: 'userTask.kocDecision.qualified', value: content.qualifiedCount, type: 'number' },
      { label: 'userTask.kocDecision.target', value: content.targetCount, type: 'number' },
    ];
  });

  readonly tableConfig: TableConfig<KocCandidatePreviewItem> = {
    columns: [
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
        field: 'score',
        header: 'userTask.kocApproval.colScore',
        type: 'number',
        width: '7rem',
      },
    ],
    rowKey: 'externalProfileId',
    pagination: false,
    minWidth: '30rem',
  };

  ngOnInit(): void {
    this.store.registerAdapter(this);
  }

  ngOnDestroy(): void {
    this.store.unregisterAdapter(this);
  }

  validate(action: string): boolean {
    return action === 'FIND_MORE' || action === 'STOP';
  }

  buildVariables(): Record<string, unknown> {
    return {};
  }
}
