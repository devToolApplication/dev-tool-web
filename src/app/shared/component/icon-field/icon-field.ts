import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-field',
  standalone: false,
  templateUrl: './icon-field.html',
  styleUrl: './icon-field.css'
})
export class IconFieldComponent {
  @Input() styleClass?: string;
}
