import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-button-speed-dial',
  standalone: false,
  templateUrl: './button-speed-dial.html',
  styleUrl: './button-speed-dial.css'
})
export class ButtonSpeedDial {
  @Input() model: MenuItem[] = [];
  @Input() direction: 'up' | 'down' | 'left' | 'right' = 'up';
  @Input() type: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  @Input() showIcon = 'pi pi-bars';
  @Input() hideIcon = 'pi pi-times';
}
