import { Component, Input } from '@angular/core';
import {
  ArrayFieldState,
  FieldState,
  GridWidth,
  GroupFieldState,
  TreeFieldState
} from '../../models/form-config.model';
import { getColClass } from '../../utils/form.utils';

type ReadonlySectionField = GroupFieldState | ArrayFieldState | TreeFieldState;

@Component({
  selector: 'app-readonly-section',
  standalone: false,
  templateUrl: './readonly-section.html',
  styleUrl: './readonly-section.css'
})
export class ReadonlySectionComponent {
  @Input({ required: true }) field!: ReadonlySectionField;

  get children(): Array<FieldState | ArrayFieldState | GroupFieldState | TreeFieldState> {
    if (!('children' in this.field)) {
      return [];
    }
    const rawChildren = this.field.children;
    const children = typeof rawChildren === 'function' ? rawChildren() : rawChildren;
    return (Array.isArray(children?.[0]) ? (children as FieldState[][]).flat() : children) as Array<
      FieldState | ArrayFieldState | GroupFieldState | TreeFieldState
    >;
  }

  get helpText(): string | undefined {
    const config = this.field?.fieldConfig as { helpText?: string; description?: string };
    return config?.helpText || config?.description;
  }

  getCol(width?: GridWidth): string {
    return getColClass(width);
  }

  isArrayField(field: FieldState | ArrayFieldState | GroupFieldState | TreeFieldState): field is ArrayFieldState {
    return field.type === 'array';
  }

  isGroupField(field: FieldState | ArrayFieldState | GroupFieldState | TreeFieldState): field is GroupFieldState {
    return field.type === 'group';
  }

  isTreeField(field: FieldState | ArrayFieldState | GroupFieldState | TreeFieldState): field is TreeFieldState {
    return field.type === 'tree';
  }
}
