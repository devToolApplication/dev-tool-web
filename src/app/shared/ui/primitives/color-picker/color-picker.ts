import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-color-picker',
  standalone: false,
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.css',
  providers: [provideValueAccessor(() => ColorPicker)]
})
export class ColorPicker extends BaseInput<string> {
  @Input() format: 'hex' | 'rgb' | 'hsb' = 'hex';

  constructor() {
    super();
    this.value = '';
  }

  onColorSelect(event: { value: string }): void {
    const hex = event.value?.startsWith('#') ? event.value : `#${event.value}`;
    this.onChange(hex);
  }

  onTextChange(value: string): void {
    this.onChange(value);
  }
}
