import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-field-renderer',
  standalone: true,
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.css',
})
export class FieldRenderer {
  @Input() field: any;
}
