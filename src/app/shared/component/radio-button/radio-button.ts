import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-radio-button',
  standalone: false,
  templateUrl: './radio-button.html',
  styleUrl: './radio-button.css'
})
export class RadioButton {
  @Input() inputId = 'radio-button';
  @Input() name = 'radio-group';
  @Input() label = 'Option';
  @Input() optionValue = 'option';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
