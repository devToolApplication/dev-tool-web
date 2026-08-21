import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';

export type ActionToolbarVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ActionToolbarAction {
  id: string;
  label: string;
  icon?: string;
  variant?: ActionToolbarVariant;
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  placement?: 'primary' | 'secondary' | 'more';
}

@Component({
  selector: 'app-action-toolbar',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-toolbar.component.html',
  styleUrl: './action-toolbar.component.css',
})
export class ActionToolbarComponent implements OnChanges {
  @Input() actions: ActionToolbarAction[] = [];
  @Output() actionClick = new EventEmitter<ActionToolbarAction>();

  readonly moreOpen = signal(false);
  primaryActions: ActionToolbarAction[] = [];
  secondaryActions: ActionToolbarAction[] = [];
  moreActions: ActionToolbarAction[] = [];

  ngOnChanges(): void {
    this.primaryActions = this.filterActions('primary');
    this.secondaryActions = this.filterActions('secondary');
    this.moreActions = this.filterActions('more');
  }

  get hasMoreActions(): boolean {
    return this.moreActions.length > 0;
  }

  buttonVariant(action: ActionToolbarAction): 'primary' | 'secondary' | 'ghost' | 'destructive' {
    return action.variant ?? 'secondary';
  }

  emitAction(action: ActionToolbarAction): void {
    if (action.disabled || action.loading) {
      return;
    }
    this.moreOpen.set(false);
    this.actionClick.emit(action);
  }

  toggleMore(): void {
    this.moreOpen.update((value) => !value);
  }

  @HostListener('document:keydown.escape')
  closeByEsc(): void {
    this.moreOpen.set(false);
  }

  private filterActions(placement: ActionToolbarAction['placement']): ActionToolbarAction[] {
    return this.actions.filter(
      (action) =>
        (action.visible ?? true) &&
        (action.placement ?? 'secondary') === placement
    );
  }
}
