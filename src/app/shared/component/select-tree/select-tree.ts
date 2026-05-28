import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseInput } from '../base-input';

export interface TreeNodeOption {
  key?: string;
  label?: string;
  data?: unknown;
  icon?: string;
  children?: TreeNodeOption[];
  selectable?: boolean;
}

interface FlatNode {
  key: string;
  label: string;
  selectable: boolean;
}

@Component({
  selector: 'app-select-tree',
  standalone: false,
  templateUrl: './select-tree.html',
  styleUrl: './select-tree.css'
})
export class SelectTree extends BaseInput<string | string[] | null> implements OnChanges {
  @Input() options: TreeNodeOption[] = [];
  @Input() selectionMode: 'single' | 'multiple' | 'checkbox' = 'single';
  @Input() filter = false;

  flatOptions: FlatNode[] = [];

  constructor() {
    super();
    this.placeholder = 'selectNode';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.flatOptions = this.flatten(this.options);
    }
  }

  private flatten(nodes: TreeNodeOption[], depth = 0): FlatNode[] {
    const result: FlatNode[] = [];
    for (const node of nodes) {
      const prefix = '  '.repeat(depth);
      result.push({
        key: node.key ?? node.label ?? '',
        label: prefix + (node.label ?? ''),
        selectable: node.selectable !== false
      });
      if (node.children?.length) {
        result.push(...this.flatten(node.children, depth + 1));
      }
    }
    return result;
  }
}
