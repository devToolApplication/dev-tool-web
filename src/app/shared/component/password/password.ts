import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-password',
  standalone: false,
  templateUrl: './password.html',
  styleUrl: './password.css',
  providers: [provideValueAccessor(() => Password)]
})
export class Password extends BaseInput<string> {
  @Input() feedback = true;
  @Input() toggleMask = true;
  @Input() promptLabel = 'passwordPrompt';
  @Input() weakLabel = 'weak';
  @Input() mediumLabel = 'medium';
  @Input() strongLabel = 'strong';

  constructor() {
    super();
    this.value = '';
  }
}
