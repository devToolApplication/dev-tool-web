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
  templateUrl: './field-array-renderer.html'
})
export class FieldArrayRenderer {

  @Input({ required: true })
  field!: ArrayFieldState;

  addItem() {
    this.field.arrayState?.addItem({});
  }

  removeItem(index: number) {
    this.field.arrayState?.removeItem(index);
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
