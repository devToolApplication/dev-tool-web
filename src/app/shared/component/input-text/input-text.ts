import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-input-text',
  standalone: false,
  templateUrl: './input-text.html',
  styleUrl: './input-text.css',
})
export class InputText extends BaseInput<string> {
  constructor() {
    super();
    this.value = '';
  }
}
