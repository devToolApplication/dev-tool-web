import { Location } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CrudPageActionConfig, CrudPageConfig } from './base-crud-page.model';
import { FormConfig, FormContext } from '../form-input/models/form-config.model';
import { FormInput } from '../form-input/form-input';

@Component({
  selector: 'app-base-crud-page',
  standalone: false,
  templateUrl: './base-crud-page.component.html',
  styleUrl: './base-crud-page.component.css'
})
export class BaseCrudPageComponent {
  @ViewChild(FormInput) private formInput?: FormInput;

  @Input({ required: true }) pageConfig!: CrudPageConfig;
  @Input() formConfig!: FormConfig;
  @Input() formContext!: FormContext;
  @Input() formInitialValue: any;
  @Input() formVisible = true;
  @Input() submitting = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<string>();

  constructor(private readonly location: Location) {}

  onFormSubmit(model: any): void {
    this.formSubmit.emit(model);
  }

  onValueChange(model: any): void {
    this.valueChange.emit(model);
  }

  onActionClick(action: CrudPageActionConfig): void {
    if (action.disabled || action.loading) {
      return;
    }

    if (action.submitForm) {
      this.formInput?.onSubmit();
      return;
    }

    if (action.goBack) {
      this.location.back();
      return;
    }

    this.actionClick.emit(action.id);
  }
}
