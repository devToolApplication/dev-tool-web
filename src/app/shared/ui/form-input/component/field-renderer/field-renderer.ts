import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AutoCompleteFieldConfig, FieldState, InputMultiFieldConfig, NumberFieldConfig } from '../../models/form-config.model';


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
  inputMultiConfig?: InputMultiFieldConfig;
  autoCompleteConfig?: AutoCompleteFieldConfig;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.field?.type === 'number') {
      this.numberConfig = this.field.fieldConfig as NumberFieldConfig;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
    } else if (this.field?.type === 'auto-complete') {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = this.field.fieldConfig as AutoCompleteFieldConfig;
    } else if (this.field?.type === 'input-multi') {
      this.numberConfig = undefined;
      this.inputMultiConfig = this.field.fieldConfig as InputMultiFieldConfig;
      this.autoCompleteConfig = undefined;
    } else {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
    }
  }

  get showInvalid() {
    return !this.field.focusing() && this.field.touched() && !!this.field.errors();
  }

  get isArray() {
    return this.field.type === 'array';
  }

  onChangeValue(value: any) {
    this.field.setValue(value);
  }

  onEnter() {
    this.field.focusing.set(true);
    this.field.blurred.set(false);
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
