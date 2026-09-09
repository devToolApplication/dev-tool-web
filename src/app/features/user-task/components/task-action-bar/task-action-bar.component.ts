import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TaskHostStore } from '../../services/task-host.store';

@Component({
  selector: 'app-task-action-bar',
  standalone: false,
  templateUrl: './task-action-bar.component.html',
  styleUrl: './task-action-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskActionBarComponent {
  readonly store = inject(TaskHostStore);

  private lastActionTrigger?: HTMLElement | null = null;

  onCommentChange(value: string | null): void {
    this.store.setComment(value || '');
  }

  async onAction(action: string, triggerElement?: HTMLElement): Promise<void> {
    this.lastActionTrigger = triggerElement || (document.activeElement as HTMLElement | null);
    const success = await this.store.initiateAction(action);
    if (!success) {
      this.restoreFocus();
    }
  }

  restoreFocus(): void {
    const trigger = this.lastActionTrigger;
    if (!trigger || typeof trigger.focus !== 'function') return;

    setTimeout(() => trigger.focus());
  }

  actionVariant(action: string): 'primary' | 'destructive' | 'secondary' {
    switch (action) {
      case 'APPROVE':
      case 'CONFIRM':
      case 'FIND_MORE':
        return 'primary';
      case 'REJECT':
      case 'STOP':
        return 'destructive';
      case 'RETURN':
      default:
        return 'secondary';
    }
  }

  actionLabel(action: string): string {
    switch (action) {
      case 'APPROVE':
        return 'userTask.actions.approve';
      case 'REJECT':
        return 'userTask.actions.reject';
      case 'RETURN':
        return 'userTask.actions.return';
      case 'FIND_MORE':
        return 'userTask.actions.findMore';
      case 'STOP':
        return 'userTask.actions.stop';
      case 'CONFIRM':
        return 'userTask.actions.confirm';
      default:
        return action;
    }
  }

  actionIcon(action: string): string | undefined {
    switch (action) {
      case 'APPROVE':
        return 'pi pi-check';
      case 'REJECT':
        return 'pi pi-times';
      case 'RETURN':
        return 'pi pi-replay';
      case 'FIND_MORE':
        return 'pi pi-search-plus';
      case 'STOP':
        return 'pi pi-stop-circle';
      case 'CONFIRM':
        return 'pi pi-shield';
      default:
        return undefined;
    }
  }

  hasRequiredCommentAction(): boolean {
    const actions = this.store.allowedActions();
    return actions.includes('REJECT') || actions.includes('RETURN');
  }
}
