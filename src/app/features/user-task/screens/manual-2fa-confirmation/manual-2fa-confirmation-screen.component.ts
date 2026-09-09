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
import {
  Manual2faConfirmationContent,
  UserTaskSummary,
} from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-manual-2fa-confirmation-screen',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-panel [title]="'userTask.manual2fa.title' | translateContent">
      <div class="space-y-4">
        <app-key-value-list [items]="details()" layout="one-column"></app-key-value-list>

        <div class="border-t border-[var(--app-border-soft)] pt-4">
          <p class="mb-2 text-sm text-[var(--app-text-muted)]">
            {{ 'userTask.manual2fa.instruction' | translateContent }}
          </p>
          @if (verificationNumber()) {
            <app-copyable-text
              [value]="verificationNumber()"
              [shorten]="false"
            ></app-copyable-text>
          } @else {
            <app-alert
              variant="warning"
              [title]="'userTask.manual2fa.numberMissing' | translateContent"
            ></app-alert>
          }
        </div>
      </div>
    </app-section-panel>
  `,
})
export class Manual2faConfirmationScreenComponent
  implements OnInit, OnDestroy, TaskScreenAdapter
{
  private readonly store = inject(TaskHostStore);
  private readonly contentState = signal<Manual2faConfirmationContent | null>(null);

  @Input() task?: UserTaskSummary;
  @Input()
  set content(value: Manual2faConfirmationContent | null | undefined) {
    this.contentState.set(value ?? null);
  }

  readonly verificationNumber = computed(() => {
    const value = this.contentState()?.verificationNumber;
    return value && value.trim() ? value : null;
  });
  readonly details = computed<KeyValueItem[]>(() => {
    const content = this.contentState();
    if (!content) return [];
    return [
      { label: 'userTask.manual2fa.platform', value: content.platform },
      { label: 'userTask.manual2fa.actionRequired', value: content.actionRequired },
      { label: 'userTask.manual2fa.message', value: content.message },
    ];
  });

  ngOnInit(): void {
    this.store.registerAdapter(this);
  }

  ngOnDestroy(): void {
    this.store.unregisterAdapter(this);
  }

  validate(action: string): boolean {
    return action === 'CONFIRM';
  }

  buildVariables(): Record<string, unknown> {
    return {};
  }
}
