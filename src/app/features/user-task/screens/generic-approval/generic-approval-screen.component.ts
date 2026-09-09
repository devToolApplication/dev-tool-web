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
import { TaskScreenAdapter } from '../../models/task-screen-adapter.model';
import { GenericApprovalContent, UserTaskSummary } from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-generic-approval-screen',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-section-panel [title]="contentState()?.title || ('userTask.generic.title' | translateContent)">
        @if (contentState()?.summary) {
          <p class="mb-4 text-sm text-[var(--app-text-muted)]">{{ contentState()?.summary }}</p>
        }
        <app-key-value-list [items]="headerItems()" layout="two-column"></app-key-value-list>
      </app-section-panel>

      @if (fieldItems().length) {
        <app-section-panel [title]="'userTask.generic.fields' | translateContent">
          <app-key-value-list [items]="fieldItems()" layout="two-column"></app-key-value-list>
        </app-section-panel>
      }
    </div>
  `,
})
export class GenericApprovalScreenComponent implements OnInit, OnDestroy, TaskScreenAdapter {
  private readonly store = inject(TaskHostStore);
  readonly contentState = signal<GenericApprovalContent | null>(null);

  @Input() task?: UserTaskSummary;
  @Input()
  set content(value: GenericApprovalContent | null | undefined) {
    this.contentState.set(value ?? null);
  }

  readonly headerItems = computed<KeyValueItem[]>(() => {
    const content = this.contentState();
    if (!content) return [];
    return [
      ...(content.reference
        ? [{ label: 'userTask.generic.reference', value: content.reference, copyable: true }]
        : []),
      ...(content.requester
        ? [{ label: 'userTask.generic.requester', value: content.requester }]
        : []),
      ...(content.submittedAt
        ? [
            {
              label: 'userTask.generic.submittedAt',
              value: content.submittedAt,
              type: 'datetime' as const,
            },
          ]
        : []),
    ];
  });

  readonly fieldItems = computed<KeyValueItem[]>(() =>
    (this.contentState()?.fields ?? [])
      .filter((field) => typeof field.value === 'string')
      .map((field) => ({ label: field.label, value: field.value })),
  );

  ngOnInit(): void {
    this.store.registerAdapter(this);
  }

  ngOnDestroy(): void {
    this.store.unregisterAdapter(this);
  }

  validate(action: string): boolean {
    return action === 'APPROVE' || action === 'REJECT' || action === 'RETURN';
  }

  buildVariables(): Record<string, unknown> {
    return {};
  }
}
