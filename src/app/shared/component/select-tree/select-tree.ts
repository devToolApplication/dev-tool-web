import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-select-tree',
  standalone: false,
  templateUrl: './select-tree.html',
  styleUrl: './select-tree.css'
})
export class SelectTree {
  @Input() placeholder = 'Chọn node';
  @Input() options: TreeNode[] = [];

  @Input() value: TreeNode | null = null;
  @Output() valueChange = new EventEmitter<TreeNode | null>();
}
