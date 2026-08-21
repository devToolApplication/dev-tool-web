import { Component } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-toggle-switch',
  standalone: false,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.css',
  providers: [provideValueAccessor(() => ToggleSwitch)]
})
export class ToggleSwitch extends BaseInput<boolean> {
  constructor() {
    super();
    this.value = false;
  }
}
