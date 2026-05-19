import { AfterViewChecked, Component, ElementRef, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-button-speed-dial',
  standalone: false,
  templateUrl: './button-speed-dial.html',
  styleUrl: './button-speed-dial.css'
})
export class ButtonSpeedDial implements AfterViewChecked {
  @Input() model: MenuItem[] = [];
  @Input() direction: 'up' | 'down' | 'left' | 'right' = 'up';
  @Input() type: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  @Input() showIcon = 'pi pi-bars';
  @Input() hideIcon = 'pi pi-times';
  @Input() ariaLabel = 'Open actions menu';

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewChecked(): void {
    this.host.nativeElement
      .querySelectorAll<HTMLElement>('.p-speeddial-list[role="menu"]')
      .forEach((list) => {
        list.removeAttribute('role');
        list.removeAttribute('aria-orientation');
      });
    this.host.nativeElement
      .querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')
      .forEach((button) => button.removeAttribute('role'));
    this.host.nativeElement
      .querySelectorAll<HTMLElement>('.p-speeddial-item[role="menuitem"]')
      .forEach((item) => {
        item.removeAttribute('role');
        item.removeAttribute('aria-controls');
      });
  }
}
