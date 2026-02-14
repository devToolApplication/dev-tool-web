import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FieldState, NumberFieldConfig } from '../../models/form-config.model';

@Component({
  selector: 'app-field-renderer',
  standalone: false,
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.css'
})
export class FieldRenderer implements OnChanges {

  @Input({ required: true })
  field!: FieldState;

  numberConfig?: NumberFieldConfig;

  ngOnChanges(changes: SimpleChanges): void {    
    if (this.field?.type === 'number') {
      this.numberConfig = this.field.fieldConfig as NumberFieldConfig;
    } else {
      this.numberConfig = undefined;
    }
  }

  get showInvalid() {
    return !this.field.focusing() && this.field.touched() && !!this.field.errors();
  }

  get isArray() {
    return this.field.type === 'array';
  }
  
  onFocus() {
    this.field.focusing.set(true);
    this.field.blurred.set(false);
  }

  onBlur() {
    this.field.focusing.set(false);
    this.field.blurred.set(true);
    this.field.touched.set(true);
  }
}
