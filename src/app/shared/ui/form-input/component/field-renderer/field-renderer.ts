import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  AutoCompleteFieldConfig,
  FieldState,
  InputMultiFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  TextFieldConfig
} from '../../models/form-config.model';


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
  selectConfig?: SelectFieldConfig;
  textConfig?: TextFieldConfig;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.field?.type === 'number') {
      this.numberConfig = this.field.fieldConfig as NumberFieldConfig;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (this.field?.type === 'auto-complete') {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = this.field.fieldConfig as AutoCompleteFieldConfig;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (this.field?.type === 'input-multi') {
      this.numberConfig = undefined;
      this.inputMultiConfig = this.field.fieldConfig as InputMultiFieldConfig;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (this.field?.type === 'select' || this.field?.type === 'select-multi') {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = this.field.fieldConfig as SelectFieldConfig;
      this.textConfig = undefined;
    } else if (this.field?.type === 'text' || this.field?.type === 'textarea') {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = this.field.fieldConfig as TextFieldConfig;
    } else {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
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
