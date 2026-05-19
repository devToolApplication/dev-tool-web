import { Location } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CrudPageActionConfig, CrudPageConfig } from './base-crud-page.model';
import { FormConfig, FormContext, FormValidationError } from '../form-input/models/form-config.model';
import { FormInput } from '../form-input/form-input';
import { ConfirmDialogService } from '../overlay/confirm-dialog/confirm-dialog.service';

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
  @Input() apiError?: string | null;
  @Input() apiFieldErrors?: Record<string, string | string[]> | FormValidationError[] | null;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<string>();

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly confirmDialogService: ConfirmDialogService
  ) {}

  onFormSubmit(model: any): void {
    this.formSubmit.emit(model);
  }

  onValueChange(model: any): void {
    this.valueChange.emit(model);
  }

  async onActionClick(action: CrudPageActionConfig): Promise<void> {
    if (action.disabled || action.loading) {
      return;
    }

    if (action.submitForm) {
      if (this.submitting) {
        return;
      }
      this.formInput?.onSubmit();
      return;
    }

    if (action.goBack) {
      if (!(await this.confirmLeaveIfDirty())) {
        return;
      }
      if (action.backLink) {
        if (Array.isArray(action.backLink)) {
          void this.router.navigate(action.backLink);
        } else {
          void this.router.navigateByUrl(action.backLink);
        }
        return;
      }
      this.location.back();
      return;
    }

    this.actionClick.emit(action.id);
  }

  hasUnsavedChanges(): boolean {
    return this.formInput?.isDirty() ?? false;
  }

  markFormPristine(): void {
    this.formInput?.resetDirtyState();
  }

  async confirmDiscardChanges(): Promise<boolean> {
    return this.confirmLeaveIfDirty();
  }

  private async confirmLeaveIfDirty(): Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    return await this.confirmDialogService.confirm({
      title: 'confirm',
      message: 'shared.form.confirmLeave',
      confirmText: 'yes',
      cancelText: 'cancel',
      variant: 'warning'
    });
  }
}
