import { Component, Input } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-select-tree',
  standalone: false,
  templateUrl: './select-tree.html',
  styleUrl: './select-tree.css'
})
export class SelectTree extends BaseInput<string | string[] | null> {
  @Input() options: TreeNode[] = [];
  @Input() selectionMode: 'single' | 'multiple' | 'checkbox' = 'single';
  @Input() filter = false;

  constructor() {
    super();
    this.placeholder = 'Chọn node';
  }
}
