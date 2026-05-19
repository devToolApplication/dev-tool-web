import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SelectOption } from '../models/form-config.model';

export interface FormInputOptionsLoader {
  source: string;
  load(): Observable<SelectOption[]>;
}

export const FORM_INPUT_OPTIONS_LOADERS = new InjectionToken<FormInputOptionsLoader[]>('FORM_INPUT_OPTIONS_LOADERS');
