import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { FormInput } from '../../../../../../shared/ui/form-input/form-input';
import { FormConfig, FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { TradeBotTextKey } from '../strategy-ui.enums';

@Component({
  selector: 'app-strategy-specific-config-section',
  standalone: false,
  templateUrl: './strategy-specific-config-section.component.html',
  styleUrl: './strategy-specific-config-section.component.css'
})
export class StrategySpecificConfigSectionComponent implements OnChanges {
  @ViewChild('configForm') configForm?: FormInput;
  @Input({ required: true }) config!: FormConfig;
  @Input() context: FormContext = { user: null, mode: 'create', extra: {} };
  @Input() initialValue: Record<string, unknown> = {};
  @Input() subtitle: string = TradeBotTextKey.StrategyConfigurationDesc;
  @Output() configChange = new EventEmitter<Record<string, unknown>>();

  readonly visible = signal(true);
  readonly TEXT = TradeBotTextKey;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] && !changes['initialValue'].firstChange) {
      this.visible.set(false);
      queueMicrotask(() => this.visible.set(true));
    }
  }

  markAllAsTouched(): void {
    this.configForm?.markAllAsTouched();
  }

  isValid(): boolean {
    return this.configForm?.isValid() ?? true;
  }

  getModel<TModel extends Record<string, unknown> = Record<string, unknown>>(): TModel {
    return this.configForm?.getModel<TModel>() ?? ({} as TModel);
  }
}
