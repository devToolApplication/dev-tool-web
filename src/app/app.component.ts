import { Component } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { SelectOption } from './shared/component/select/select';
import {FormConfig, FormContext} from './shared/ui/form-input/models/form-config.model';

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
  selectedTreeNode: TreeNode | null = null;
  selectedButton: string | number | null = 'A';
  checked = true;
  toggleChecked = false;
  radioValue = 'option-1';

  paginatorState = { first: 0, rows: 10, totalRecords: 100 };

  config: FormConfig = {
    fields: [

      {
        type: 'text',
        name: 'name',
        label: 'Ten',
        width: '1/2',
        validation: [
          {
            expression: '!value',
            message: 'Name is required'
          }
        ]
      },

      {
        type: 'number',
        label: 'Tuổi',
        name: 'age',
        width: '1/2',
        mode: 'currency',
        currency: 'USD',
        rules: {
          disabled: 'model.name != null && model.name !== ""'
        },
        validation: [
          {
            expression: 'value <= 0',
            message: 'Tuoi khong duoc âm'
          }
        ]
      },

      {
        type: 'select',
        label: 'Chi nhánh',
        name: 'branch',
        width: '1/2',
        optionsExpression: `
        extra.branches
          .filter(x => x.address === user.address)
          .map(x => ({ label: x.name, value: x.id }))
      `
      },
      {
        type: 'checkbox',
        name: 'confirm',
        label: 'Confirm this change',
        width: '1/2',
        validation: [
          {
            expression: 'value == false',
            message: 'BAC'
          }
        ]
      },
      {
        type: 'date',
        name: 'dateOfBirth',
        label: 'Date of Birth',
        width: '1/2',
        validation: [
          {
            expression: '!value',
            message: 'Empty'
          }
        ]
      },
      {
        type: 'radio',
        name: 'gender',
        label: 'Gender',
        width: '1/2',
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' }
        ],
        validation: [
          {
            expression: '!value',
            message: 'Gender is required'
          }
        ]
      },
      {
        type: 'select-multi',
        name: 'skills',
        label: 'Skills',
        width: 'full',
        options: [
          { label: 'Angular', value: 'angular' },
          { label: 'React', value: 'react' },
          { label: 'Vue', value: 'vue' }
        ],
        validation: [
          {
            expression: '!value || value.length === 0',
            message: 'Please select at least one skill'
          }
        ]
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        width: 'full',
        validation: [
          {
            expression: '!value',
            message: 'Description is required.'
          }
        ]
      }
    ]
  };

  initialValue = {
    name: '',
    age: null,
    branch: null,
    confirm: false,
    dateOfBirth: null,
    gender: null,
    skills: [],
    description: ''
  };

  context : FormContext  = {
    user: { address: 'HCM' },
    extra: {
      branches: [
        { id: 1, name: 'CN HCM', address: 'HCM' },
        { id: 2, name: 'CN HN', address: 'HN' }
      ]
    },
    mode: 'create'
  };

  save(data: any) {
    console.log('Submit:', data);
  }

  onPageChange(event: PaginatorState): void {
    this.paginatorState = {
      ...this.paginatorState,
      first: event.first ?? 0,
      rows: event.rows ?? 10
    };
  }
}
