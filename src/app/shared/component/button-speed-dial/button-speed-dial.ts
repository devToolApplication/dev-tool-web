import { Component, Input } from '@angular/core';
import { AppMenuItem } from '../button-split/button-split';

@Component({
  selector: 'app-button-speed-dial',
  standalone: false,
  templateUrl: './button-speed-dial.html',
  styleUrl: './button-speed-dial.css'
})
export class ButtonSpeedDial {
  @Input() model: AppMenuItem[] = [];
  @Input() direction: 'up' | 'down' | 'left' | 'right' = 'up';
  @Input() type: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  @Input() showIcon = 'pi pi-bars';
  @Input() hideIcon = 'pi pi-times';
  @Input() ariaLabel = 'Open actions menu';

  menuOpen = false;

  onItemClick(item: AppMenuItem): void {
    if (item.command) item.command();
    this.menuOpen = false;
  }
}
