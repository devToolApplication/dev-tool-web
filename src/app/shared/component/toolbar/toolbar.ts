import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: false,
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css'
})
export class ToolbarComponent {
  @Input() styleClass?: string;
}
