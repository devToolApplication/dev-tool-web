import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ConfirmDialogConfig, ConfirmDialogService } from '../../overlay/confirm-dialog/confirm-dialog.service';

export type ActionToolbarVariant = 'default' | 'primary' | 'warning' | 'danger' | 'ghost';

export interface ActionToolbarAction {
  id: string;
  label: string;
  icon?: string;
  variant?: ActionToolbarVariant;
  visible?: boolean;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  permissions?: readonly string[];
  permissionMode?: 'hide' | 'disable';
  permissionDeniedTooltip?: string;
  placement?: 'primary' | 'secondary' | 'more';
  confirm?: ConfirmDialogConfig;
}

@Component({
  selector: 'app-action-toolbar',
  standalone: false,
  templateUrl: './action-toolbar.component.html',
  styleUrl: './action-toolbar.component.css'
})
export class ActionToolbarComponent {
  @Input() actions: ActionToolbarAction[] = [];
  @Output() actionClick = new EventEmitter<ActionToolbarAction>();

  readonly moreOpen = signal(false);

  constructor(
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly permissionService: PermissionService
  ) {}

  visibleActions(placement: ActionToolbarAction['placement']): ActionToolbarAction[] {
    return this.actions.filter(
      (action) => (action.visible ?? true) && (action.placement ?? 'secondary') === placement && this.canRenderAction(action)
    );
  }

  get moreActions(): ActionToolbarAction[] {
    return this.visibleActions('more');
  }

  get hasMoreActions(): boolean {
    return this.moreActions.length > 0;
  }

  severity(action: ActionToolbarAction): 'secondary' | 'success' | 'info' | 'warn' | 'danger' | null {
    switch (action.variant) {
      case 'primary':
        return 'info';
      case 'warning':
        return 'warn';
      case 'danger':
        return 'danger';
      case 'ghost':
      case 'default':
      default:
        return 'secondary';
    }
  }

  async emitAction(action: ActionToolbarAction): Promise<void> {
    if (this.isActionDisabled(action) || action.loading) {
      return;
    }
    const confirmConfig = action.confirm ?? (action.variant === 'danger'
      ? { message: 'shared.confirm.dangerAction', variant: 'danger' as const }
      : undefined);

    if (confirmConfig) {
      const confirmed = await this.confirmDialogService.confirm({
        variant: action.variant === 'danger' ? 'danger' : confirmConfig.variant,
        ...confirmConfig
      });
      if (!confirmed) {
        this.moreOpen.set(false);
        return;
      }
    }
    this.moreOpen.set(false);
    this.actionClick.emit(action);
  }

  toggleMore(): void {
    this.moreOpen.update((value) => !value);
  }

  isActionDisabled(action: ActionToolbarAction): boolean {
    return action.disabled === true || !this.hasPermission(action);
  }

  actionTooltip(action: ActionToolbarAction): string | undefined {
    if (!this.hasPermission(action)) {
      return action.permissionDeniedTooltip ?? 'shared.permission.deniedAction';
    }

    return action.tooltip;
  }

  @HostListener('document:keydown.escape')
  closeByEsc(): void {
    this.moreOpen.set(false);
  }

  private canRenderAction(action: ActionToolbarAction): boolean {
    if (action.permissionMode === 'hide' && !this.hasPermission(action)) {
      return false;
    }

    return true;
  }

  private hasPermission(action: ActionToolbarAction): boolean {
    return !action.permissions?.length || this.permissionService.hasAll(action.permissions);
  }
}
