import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-fieldset',
  standalone: false,
  templateUrl: './fieldset.component.html',
  styleUrl: './fieldset.component.css'
})
export class FieldsetComponent {
  @Input() legend = '';
  @Input() toggleable = false;
  @Input() collapsed = false;
}
