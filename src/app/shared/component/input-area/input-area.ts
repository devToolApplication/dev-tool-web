import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-input-area',
  standalone: false,
  templateUrl: './input-area.html',
  styleUrl: './input-area.css'
})
export class InputArea extends BaseInput<string> {
  @Input() rows = 4;

  constructor() {
    super();
  }
}
