import { Component } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-input-text',
  standalone: false,
  templateUrl: './input-text.html',
  styleUrl: './input-text.css',
  providers: [provideValueAccessor(() => InputText)]
})
export class InputText extends BaseInput<string> {
  constructor() {
    super();
    this.value = '';
  }
}
