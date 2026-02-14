import { Component, Input } from '@angular/core';
import { ArrayFieldState, GridWidth } from '../../models/form-config.model';
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
}
