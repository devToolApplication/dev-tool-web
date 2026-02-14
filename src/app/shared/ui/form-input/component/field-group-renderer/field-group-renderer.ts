import { Component, Input } from '@angular/core';
import {
  GroupFieldState,
  GridWidth
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';

@Component({
  selector: 'app-field-group-renderer',
  standalone: false,
  templateUrl: './field-group-renderer.html',
  styleUrl: './field-group-renderer.css'
})
export class FieldGroupRenderer {

  @Input({ required: true })
  field!: GroupFieldState;

  getCol(width?: GridWidth): string {
    return getColClass(width);
  }
}
