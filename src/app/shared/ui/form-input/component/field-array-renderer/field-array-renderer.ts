import { Component, Input } from '@angular/core';
import {
  ArrayFieldState,
  FieldState,
  GridWidth,
  GroupFieldState,
  TreeFieldState
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';

@Component({
  selector: 'app-field-array-renderer',
  standalone: false,
  templateUrl: './field-array-renderer.html',
  styleUrl: './field-array-renderer.css'
})
export class FieldArrayRenderer {

  @Input({ required: true })
  field!: ArrayFieldState;
  @Input() submitted = false;
  @Input() readonlyMode = false;

  addItem() {
    this.field.arrayState?.addItem({});
    this.field.markAsTouched();
  }

  removeItem(index: number) {
    this.field.arrayState?.removeItem(index);
    this.field.markAsTouched();
  }

  moveItem(index: number, direction: -1 | 1) {
    this.field.arrayState?.moveItem(index, direction);
    this.field.markAsTouched();
  }

  canMove(index: number, direction: -1 | 1): boolean {
    const targetIndex = index + direction;
    return targetIndex >= 0 && targetIndex < this.field.value().length;
  }

  getCol(width?: GridWidth): string {
    return getColClass(width)
  }

  isArrayField(field: FieldState | ArrayFieldState): field is ArrayFieldState {
    return field.type === 'array';
  }

  isGroupField(field: FieldState | ArrayFieldState): field is GroupFieldState {
    return field.type === 'group';
  }

  isTreeField(field: FieldState | ArrayFieldState): field is TreeFieldState {
    return field.type === 'tree';
  }
}
