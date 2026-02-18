import { Component } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-toggle-switch',
  standalone: false,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.css'
})
export class ToggleSwitch extends BaseInput<boolean> {
  constructor() {
    super();
    this.value = false;
  }
}
