import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-input-text',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-text.html',
  styleUrl: './input-text.css',
  providers: [provideValueAccessor(() => InputText)]
})
export class InputText extends BaseInput<string> {
  @Input() autocomplete = 'on';
  @Input() inputMode?: string;
  @Input() name?: string;
  @Input() describedBy?: string | null;

  constructor() {
    super();
    this.value = '';
  }
}
