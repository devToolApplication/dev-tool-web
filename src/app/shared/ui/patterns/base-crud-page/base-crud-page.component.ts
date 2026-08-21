import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import type { BaseCrudPageActionConfig, BaseCrudPageConfig } from './base-crud-page.model';
import type { FormContext, FormValidationError } from '../form-input/models/form-config.model';
import { FormInput } from '../form-input/form-input';

@Component({
  selector: 'app-base-crud-page',
  standalone: false,
  templateUrl: './base-crud-page.component.html',
  styleUrl: './base-crud-page.component.css'
})
export class BaseCrudPageComponent {
  @ViewChild(FormInput) private formInput?: FormInput;

  @Input({ required: true }) config!: BaseCrudPageConfig;
  @Input({ required: true }) context!: FormContext;
  @Input({ required: true }) model!: unknown;
  @Input() busy = false;
  @Input() apiError?: string | null;
  @Input() apiFieldErrors?: Record<string, string | string[]> | FormValidationError[] | null;

  @Output() submit = new EventEmitter<unknown>();
  @Output() valueChange = new EventEmitter<unknown>();
  @Output() action = new EventEmitter<BaseCrudPageActionConfig>();

  get visibleActions(): BaseCrudPageActionConfig[] {
    return (this.config.actions ?? []).filter((action) => action.visible ?? true);
  }

  onFormSubmit(model: unknown): void {
    this.submit.emit(model);
  }

  onValueChange(model: unknown): void {
    this.valueChange.emit(model);
  }

  onActionClick(action: BaseCrudPageActionConfig): void {
    if (!this.canRunAction(action)) {
      return;
    }

    if (action.kind === 'submit') {
      this.submitForm();
      return;
    }

    this.action.emit(action);
  }

  hasUnsavedChanges(): boolean {
    return this.formInput?.isDirty() ?? false;
  }

  markFormPristine(): void {
    this.formInput?.resetDirtyState();
  }

  submitForm(): void {
    if (this.busy) {
      return;
    }

    this.formInput?.onSubmit();
  }

  private canRunAction(action: BaseCrudPageActionConfig): boolean {
    return (action.visible ?? true) && !this.isActionDisabled(action);
  }

  isActionDisabled(action: BaseCrudPageActionConfig): boolean {
    return (action.disabled ?? false) || (action.loading ?? false) || (this.isSubmitAction(action) && this.busy);
  }

  isActionLoading(action: BaseCrudPageActionConfig): boolean {
    return (action.loading ?? false) || (this.isSubmitAction(action) && this.busy);
  }

  isSubmitAction(action: BaseCrudPageActionConfig): boolean {
    return action.kind === 'submit';
  }
}
