import { Component, Input } from '@angular/core';
import {
  ArrayFieldState,
  FieldState,
  GridWidth,
  TreeFieldState
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';

@Component({
  selector: 'app-field-tree-renderer',
  standalone: false,
  templateUrl: './field-tree-renderer.html',
  styleUrl: './field-tree-renderer.css'
})
export class FieldTreeRendererComponent {
  @Input({ required: true })
  field!: TreeFieldState;

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
