import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export type DemoSection = 'input' | 'select' | 'button';

type InputPreset = {
  label: string;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  invalid: boolean;
  errorMessage?: string;
  helpText?: string;
};

type SelectPreset = {
  label: string;
  placeholder: string;
  showClear: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  options: { label: string; value: string | number | boolean | null }[];
};

type ButtonPreset = {
  label: string;
  severity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null;
  text: boolean;
  disabled: boolean;
  icon?: string;
};

@Component({
  selector: 'app-demo',
  standalone: false,
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent {
  section: DemoSection = 'input';

  inputValue = '';
  inputConfig: InputPreset = {
    label: 'Username',
    placeholder: 'Type your username',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    helpText: 'Try changing presets with the buttons below.'
  };

  selectValue: string | null = null;
  selectConfig: SelectPreset = {
    label: 'Status',
    placeholder: 'Select status',
    showClear: false,
    disabled: false,
    required: false,
    invalid: false,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' }
    ]
  };

  buttonConfig: ButtonPreset = {
    label: 'Save',
    severity: null,
    text: false,
    disabled: false,
    icon: 'pi pi-check'
  };

  constructor(private readonly route: ActivatedRoute) {
    this.route.paramMap.subscribe((params) => {
      const section = params.get('section');
      this.section = section === 'select' || section === 'button' ? section : 'input';
    });
  }

  get title(): string {
    if (this.section === 'select') return 'Select Demo';
    if (this.section === 'button') return 'Button Demo';
    return 'Input Demo';
  }

  applyInputPreset(type: 'default' | 'required' | 'readonly' | 'error'): void {
    const presets: Record<typeof type, InputPreset> = {
      default: {
        label: 'Username',
        placeholder: 'Type your username',
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        helpText: 'Normal input mode'
      },
      required: {
        label: 'Email',
        placeholder: 'name@company.com',
        disabled: false,
        readonly: false,
        required: true,
        invalid: false,
        helpText: 'This field is required'
      },
      readonly: {
        label: 'Employee ID',
        placeholder: '',
        disabled: false,
        readonly: true,
        required: false,
        invalid: false,
        helpText: 'Readonly value for display'
      },
      error: {
        label: 'Phone',
        placeholder: 'Enter phone number',
        disabled: false,
        readonly: false,
        required: true,
        invalid: true,
        errorMessage: 'Phone format is invalid'
      }
    };

    this.inputConfig = presets[type];
  }

  applySelectPreset(type: 'default' | 'clearable' | 'required' | 'error'): void {
    const presets: Record<typeof type, SelectPreset> = {
      default: {
        label: 'Status',
        placeholder: 'Select status',
        showClear: false,
        disabled: false,
        required: false,
        invalid: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' }
        ]
      },
      clearable: {
        label: 'Priority',
        placeholder: 'Select priority',
        showClear: true,
        disabled: false,
        required: false,
        invalid: false,
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]
      },
      required: {
        label: 'Branch',
        placeholder: 'Branch is required',
        showClear: false,
        disabled: false,
        required: true,
        invalid: false,
        options: [
          { label: 'HCM', value: 'hcm' },
          { label: 'Ha Noi', value: 'hn' }
        ]
      },
      error: {
        label: 'Role',
        placeholder: 'Select role',
        showClear: true,
        disabled: false,
        required: true,
        invalid: true,
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'User', value: 'user' }
        ]
      }
    };

    this.selectConfig = presets[type];
  }

  applyButtonPreset(type: 'primary' | 'success' | 'danger' | 'text' | 'disabled'): void {
    const presets: Record<typeof type, ButtonPreset> = {
      primary: {
        label: 'Save',
        severity: null,
        text: false,
        disabled: false,
        icon: 'pi pi-check'
      },
      success: {
        label: 'Approve',
        severity: 'success',
        text: false,
        disabled: false,
        icon: 'pi pi-thumbs-up'
      },
      danger: {
        label: 'Delete',
        severity: 'danger',
        text: false,
        disabled: false,
        icon: 'pi pi-trash'
      },
      text: {
        label: 'View detail',
        severity: 'secondary',
        text: true,
        disabled: false,
        icon: 'pi pi-eye'
      },
      disabled: {
        label: 'Processing',
        severity: 'warn',
        text: false,
        disabled: true,
        icon: 'pi pi-spin pi-spinner'
      }
    };

    this.buttonConfig = presets[type];
  }

  onDemoButtonClick(): void {
    console.log('Demo button clicked', this.buttonConfig);
  }
}
