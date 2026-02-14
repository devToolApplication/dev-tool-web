import { Component } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { SelectOption } from './shared/component/select/select';
import {FormConfig, FormContext} from './shared/ui/form-input/models/form-config.model';
import { Rules } from './shared/ui/form-input/utils/validation-rules';

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
  
      // ========================
      // BASIC TEXT
      // ========================
      {
        type: 'text',
        name: 'name',
        label: 'Full Name',
        width: '1/2',
        validation: [
          Rules.required('Name is required')
        ]
      },
  
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        width: '1/2',
        rules: {
          disabled: 'model.name && model.name.length > 0'
        },
        validation: [
          Rules.required('Description required')
        ]
      },
  
      // ========================
      // NUMBER
      // ========================
      {
        type: 'number',
        name: 'salary',
        label: 'Salary (Currency)',
        width: '1/3',
        mode: 'currency',
        currency: 'USD',
        minFractionDigits: 2,
        maxFractionDigits: 2,
        rules: {
          disabled: 'context.mode === "view"'
        },
        validation: [
          Rules.required(),
          Rules.positive('Salary must be > 0')
        ]
      },
  
      {
        type: 'number',
        name: 'age',
        label: 'Age (Decimal)',
        width: '1/3',
        mode: 'decimal',
        step: 1,
        validation: [
          Rules.required(),
          Rules.min(18, 'Must be >= 18')
        ]
      },
  
      // ========================
      // SELECT (STATIC)
      // ========================
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        width: '1/3',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending', disabled: true }
        ],
        validation: [
          Rules.required('Select status')
        ]
      },
  
      // ========================
      // SELECT (DYNAMIC)
      // ========================
      {
        type: 'select',
        name: 'branch',
        label: 'Branch (Dynamic)',
        width: '1/2',
        optionsExpression: `
          context.extra.branches
            .filter(x => x.address === context.user.address)
            .map(x => ({ label: x.name, value: x.id }))
        `
      },
  
      // ========================
      // MULTI SELECT
      // ========================
      {
        type: 'select-multi',
        name: 'skills',
        label: 'Skills',
        width: '1/2',
        options: [
          { label: 'Angular', value: 'angular' },
          { label: 'React', value: 'react' },
          { label: 'Vue', value: 'vue' }
        ],
        validation: [
          Rules.requiredArray('Select at least one skill')
        ]
      },
  
      // ========================
      // RADIO
      // ========================
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
          Rules.required('Gender required')
        ]
      },
  
      // ========================
      // CHECKBOX
      // ========================
      {
        type: 'checkbox',
        name: 'confirm',
        label: 'Confirm Information',
        width: '1/2',
        validation: [
          Rules.requiredTrue('Must confirm')
        ]
      },
  
      // ========================
      // DATE
      // ========================
      {
        type: 'date',
        name: 'dateOfBirth',
        label: 'Date of Birth',
        width: '1/2',
        validation: [
          Rules.required('Select date')
        ]
      },
  
      // ========================
      // GROUP
      // ========================
      {
        type: 'group',
        name: 'address',
        label: 'Address',
        width: 'full',
        children: [
          {
            type: 'text',
            name: 'street',
            label: 'Street',
            width: '1/2',
            validation: [
              Rules.required('Street required')
            ]
          },
          {
            type: 'text',
            name: 'city',
            label: 'City',
            width: '1/2',
            validation: [
              Rules.required('City required')
            ]
          }
        ]
      },
  
      // ========================
      // ARRAY
      // ========================
      {
        type: 'array',
        name: 'experiences',
        label: 'Work Experiences',
        width: '1/2',
        itemConfig: [
          {
            type: 'text',
            name: 'company',
            label: 'Company',
            width: '1/2',
            validation: [
              Rules.required('Company required')
            ]
          },
          {
            type: 'number',
            name: 'years',
            label: 'Years',
            width: '1/2',
            mode: 'decimal',
            step: 1,
            validation: [
              Rules.required(),
              Rules.positive('Years must be > 0')
            ]
          }
        ]
      }
  
    ]
  };
  
  

  initialValue = {
    name: '',
    description: '',
    salary: null,
    age: null,
    status: null,
    branch: null,
    skills: [],
    gender: null,
    confirm: false,
    dateOfBirth: null,
    address: {
      street: '',
      city: ''
    },
    experiences: []
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
