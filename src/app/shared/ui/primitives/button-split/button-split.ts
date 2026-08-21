import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface AppMenuItem {
  label?: string;
  icon?: string;
  disabled?: boolean;
  visible?: boolean;
  separator?: boolean;
  routerLink?: string | any[];
  items?: AppMenuItem[];
  command?: (event?: unknown) => void;
}

@Component({
  selector: 'app-button-split',
  standalone: false,
  templateUrl: './button-split.html',
  styleUrl: './button-split.css'
})
export class ButtonSplit {
  @Input() label = 'actions';
  @Input() icon = 'pi pi-cog';
  @Input() model: AppMenuItem[] = [];
  @Input() expandAriaLabel = 'Open actions menu';
  @Output() buttonClick = new EventEmitter<void>();

  menuOpen = false;

  onItemClick(item: AppMenuItem): void {
    if (item.command) item.command();
    this.menuOpen = false;
  }
}
