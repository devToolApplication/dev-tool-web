import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuItem, TreeNode } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { SelectOption } from '../../shared/component/select/select';

export type DemoSection =
  | 'input-text'
  | 'input-area'
  | 'input-number'
  | 'password'
  | 'check-box'
  | 'radio-button'
  | 'date-picker'
  | 'select'
  | 'select-multi'
  | 'select-tree'
  | 'select-button'
  | 'toggle-button'
  | 'toggle-switch'
  | 'button'
  | 'button-split'
  | 'button-speed-dial'
  | 'breadcrumb'
  | 'paginator'
  | 'fileupload';

@Component({
  selector: 'app-demo',
  standalone: false,
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent {
  section: DemoSection = 'input-text';

  textValue = '';
  textPlaceholder = 'Type something...';
  textInvalid = false;

  areaValue = '';
  areaRows = 4;

  numberValue: number | null = null;
  numberMode: 'decimal' | 'currency' = 'decimal';

  passwordValue = '';
  passwordFeedback = true;

  checkboxValue = false;
  radioValue: string | number | null = null;

  dateValue: Date | null = null;
  dateFormat = 'dd/mm/yy';

  selectValue: string | null = null;
  selectShowClear = false;
  selectOptions: SelectOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' }
  ];

  multiValue: Array<string | number> = [];
  multiEnableFilter = false;

  treeValue: string | string[] | null = null;
  treeSelectionMode: 'single' | 'multiple' | 'checkbox' = 'single';
  treeOptions: TreeNode[] = [
    {
      key: 'dev',
      label: 'Development',
      children: [
        { key: 'dev-fe', label: 'Frontend' },
        { key: 'dev-be', label: 'Backend' }
      ]
    },
    {
      key: 'ops',
      label: 'Operations',
      children: [
        { key: 'ops-devops', label: 'DevOps' },
        { key: 'ops-sre', label: 'SRE' }
      ]
    }
  ];

  selectButtonValue: string | number | boolean | null = null;
  selectButtonMultiple = false;
  selectButtonOptions: SelectOption[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' }
  ];

  toggleButtonValue = false;
  toggleSwitchValue = false;

  buttonSeverity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null = null;
  buttonText = false;

  splitItems: MenuItem[] = [
    { label: 'Save Draft', icon: 'pi pi-save' },
    { label: 'Publish', icon: 'pi pi-send' }
  ];

  speedDialDirection: 'up' | 'down' | 'left' | 'right' = 'up';
  speedDialType: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  speedDialItems: MenuItem[] = [
    { label: 'Copy', icon: 'pi pi-copy' },
    { label: 'Delete', icon: 'pi pi-trash' },
    { label: 'Share', icon: 'pi pi-share-alt' }
  ];

  breadcrumbItems: MenuItem[] = [
    { label: 'Admin' },
    { label: 'Component Demo' },
    { label: 'Breadcrumb' }
  ];

  paginatorFirst = 0;
  paginatorRows = 10;
  paginatorTotal = 135;

  fileUploadMode: 'basic' | 'advanced' = 'basic';
  fileUploadMultiple = false;

  private readonly validSections: DemoSection[] = [
    'input-text', 'input-area', 'input-number', 'password', 'check-box', 'radio-button', 'date-picker',
    'select', 'select-multi', 'select-tree', 'select-button', 'toggle-button', 'toggle-switch', 'button',
    'button-split', 'button-speed-dial', 'breadcrumb', 'paginator', 'fileupload'
  ];

  constructor(private readonly route: ActivatedRoute) {
    this.route.paramMap.subscribe((params) => {
      const section = params.get('section') as DemoSection | null;
      this.section = section && this.validSections.includes(section) ? section : 'input-text';
    });
  }

  get title(): string {
    return this.section.replace('-', ' ').replace(/\b\w/g, (x) => x.toUpperCase());
  }

  setTextPreset(mode: 'normal' | 'error'): void {
    this.textInvalid = mode === 'error';
    this.textPlaceholder = mode === 'error' ? 'Invalid input demo' : 'Type something...';
  }

  setNumberPreset(mode: 'decimal' | 'currency'): void {
    this.numberMode = mode;
    this.numberValue = null;
  }

  setSelectPreset(mode: 'normal' | 'clear'): void {
    this.selectShowClear = mode === 'clear';
  }

  setTreeMode(mode: 'single' | 'multiple' | 'checkbox'): void {
    this.treeSelectionMode = mode;
    this.treeValue = null;
  }

  setButtonPreset(mode: 'normal' | 'success' | 'danger' | 'text'): void {
    if (mode === 'normal') {
      this.buttonSeverity = null;
      this.buttonText = false;
      return;
    }

    if (mode === 'text') {
      this.buttonSeverity = 'secondary';
      this.buttonText = true;
      return;
    }

    this.buttonSeverity = mode;
    this.buttonText = false;
  }

  setSpeedDialPreset(mode: 'linear' | 'circle'): void {
    this.speedDialType = mode;
    this.speedDialDirection = mode === 'linear' ? 'up' : 'right';
  }

  onPageChange(state: PaginatorState): void {
    this.paginatorFirst = state.first ?? 0;
    this.paginatorRows = state.rows ?? 10;
  }
}
