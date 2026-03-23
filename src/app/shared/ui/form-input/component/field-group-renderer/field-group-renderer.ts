import { Component, Input } from '@angular/core';
import {
  ArrayFieldState,
  FieldState,
  GroupFieldState,
  GridWidth,
  TreeFieldState
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

  isArrayField(field: FieldState | ArrayFieldState): field is ArrayFieldState {
    return field.type === 'array';
  }

  isTreeField(field: FieldState | ArrayFieldState): field is TreeFieldState {
    return field.type === 'tree';
  }
}
