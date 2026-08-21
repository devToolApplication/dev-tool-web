import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-field-block',
  standalone: false,
  templateUrl: './field-block.html',
  styleUrl: './field-block.css'
})
export class FieldBlockComponent {
  @Input() label?: string;
  @Input() helpText?: string;
  @Input() required = false;
  @Input() invalid = false;
  @Input() errorMessage?: string;
  @Input() inputId?: string;
}
