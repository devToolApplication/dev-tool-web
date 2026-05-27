import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormContext } from '../../../../../../../shared/ui/form-input/models/form-config.model';
import { CANDLE_IMPORT_FORM } from '../../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-market-data-import-tab',
  standalone: false,
  templateUrl: './market-data-import-tab.component.html'
})
export class MarketDataImportTabComponent {
  @Input() loading = false;
  @Output() importSubmit = new EventEmitter<Record<string, unknown>>();

  readonly importForm = CANDLE_IMPORT_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly importInitialValue = { payload: JSON.stringify({ candles: [] }, null, 2) };
}
