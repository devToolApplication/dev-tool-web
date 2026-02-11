import { Component } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { SelectOption } from './shared/component/select/select';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  breadcrumbItems: MenuItem[] = [{ label: 'Shared' }, { label: 'Component Demo' }];

  speedDialItems: MenuItem[] = [
    { icon: 'pi pi-copy' },
    { icon: 'pi pi-pencil' },
    { icon: 'pi pi-trash' }
  ];

  splitButtonItems: MenuItem[] = [
    { label: 'Save', icon: 'pi pi-save' },
    { label: 'Delete', icon: 'pi pi-trash' }
  ];

  selectOptions: SelectOption[] = [
    { label: 'Option A', value: 'A' },
    { label: 'Option B', value: 'B' },
    { label: 'Option C', value: 'C' }
  ];

  treeOptions: TreeNode[] = [
    {
      key: '0',
      label: 'Root',
      children: [
        { key: '0-0', label: 'Child 1' },
        { key: '0-1', label: 'Child 2' }
      ]
    }
  ];

  textValue = '';
  areaValue = '';
  passwordValue = '';
  numberValue: number | null = 10;
  dateValue: Date | null = new Date();
  selectedValue: string | number | null = 'A';
  selectedMultiValues: Array<string | number> = ['A'];
  selectedTreeNode: string | null = '0-0';
  selectedButton: string | number | null = 'A';
  checked = true;
  toggleChecked = false;
  radioValue = 'option-1';

  paginatorState = { first: 0, rows: 10, totalRecords: 100 };

  onPageChange(event: PaginatorState): void {
    this.paginatorState = {
      ...this.paginatorState,
      first: event.first ?? 0,
      rows: event.rows ?? 10
    };
  }
}
