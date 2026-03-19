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
  @Input() promptLabel = 'passwordPrompt';
  @Input() weakLabel = 'weak';
  @Input() mediumLabel = 'medium';
  @Input() strongLabel = 'strong';

  constructor() {
    super();
    this.value = '';
  }
}
