import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ripple',
  standalone: false,
  templateUrl: './ripple.html',
  styleUrl: './ripple.css'
})
export class RippleComponent {
  @Input() disabled = false;
  @Input() styleClass?: string;
}
