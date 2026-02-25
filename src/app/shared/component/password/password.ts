import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-password',
  standalone: false,
  templateUrl: './password.html',
  styleUrl: './password.css'
})
export class Password extends BaseInput<string> {
  @Input() feedback = true;
  @Input() toggleMask = true;
  @Input() promptLabel = 'shared.password.prompt';
  @Input() weakLabel = 'shared.password.weak';
  @Input() mediumLabel = 'shared.password.medium';
  @Input() strongLabel = 'shared.password.strong';

  constructor() {
    super();
    this.value = '';
  }
}
