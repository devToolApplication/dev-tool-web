import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-toggle-button',
  standalone: false,
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.css'
})
export class ToggleButton extends BaseInput<boolean> {
  @Input() onLabel = 'shared.toggle.on';
  @Input() offLabel = 'shared.toggle.off';
  @Input() onIcon = 'pi pi-check';
  @Input() offIcon = 'pi pi-times';

  constructor() {
    super();
    this.value = false;
  }
}
