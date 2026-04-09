import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim().length === 0;
}

export class StrategyFormValidators {
  static nonBlank(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => (isBlank(control.value) ? { nonBlank: true } : null);
  }

  static positiveNumber(min = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = Number(control.value);
      return Number.isFinite(value) && value > min ? null : { positiveNumber: { min } };
    };
  }
}
