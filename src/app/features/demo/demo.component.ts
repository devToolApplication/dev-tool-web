import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TreeNodeOption } from '../../shared/component/select-tree/select-tree';
import { AppPaginatorState } from '../../shared/component/paginator/paginator';
import { SelectOption } from '../../shared/component/select/select';
import { AppMenuItem } from '../../shared/component/button-split/button-split';
import { ActionToolbarAction } from '../../shared/ui/layout/action-toolbar/action-toolbar.component';
import { CandleChartConfig } from '../admin/trade-bot-management/share/candle-chart/candle-chart';

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
  | 'fileupload'
  | 'candle-chart';

@Component({
  selector: 'app-demo',
  standalone: false,
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
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
    { label: 'Pending', value: 'pending' },
  ];

  multiValue: Array<string | number> = [];
  multiEnableFilter = false;

  treeValue: string | string[] | null = null;
  treeSelectionMode: 'single' | 'multiple' | 'checkbox' = 'single';
  treeOptions: TreeNodeOption[] = [
    {
      key: 'dev',
      label: 'Development',
      children: [
        { key: 'dev-fe', label: 'Frontend' },
        { key: 'dev-be', label: 'Backend' },
      ],
    },
    {
      key: 'ops',
      label: 'Operations',
      children: [
        { key: 'ops-devops', label: 'DevOps' },
        { key: 'ops-sre', label: 'SRE' },
      ],
    },
  ];

  selectButtonValue: string | number | boolean | null = null;
  selectButtonMultiple = false;
  selectButtonOptions: SelectOption[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  toggleButtonValue = false;
  toggleSwitchValue = false;

  buttonSeverity:
    | 'secondary'
    | 'success'
    | 'info'
    | 'warn'
    | 'help'
    | 'danger'
    | 'contrast'
    | null = null;
  buttonText = false;

  splitItems: AppMenuItem[] = [
    { label: 'Save Draft', icon: 'pi pi-save' },
    { label: 'Publish', icon: 'pi pi-send' },
  ];

  speedDialDirection: 'up' | 'down' | 'left' | 'right' = 'up';
  speedDialType: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  speedDialItems: AppMenuItem[] = [
    { label: 'Copy', icon: 'pi pi-copy' },
    { label: 'Delete', icon: 'pi pi-trash' },
    { label: 'Share', icon: 'pi pi-share-alt' },
  ];

  breadcrumbItems: AppMenuItem[] = [
    { label: 'Admin' },
    { label: 'Component Demo' },
    { label: 'Breadcrumb' },
  ];

  paginatorFirst = 0;
  paginatorRows = 10;
  paginatorTotal = 135;

  readonly inputTextActions: ActionToolbarAction[] = [
    { id: 'text-normal', label: 'Normal', placement: 'secondary' },
    { id: 'text-error', label: 'Error', variant: 'danger', placement: 'secondary' }
  ];
  readonly inputAreaActions: ActionToolbarAction[] = [
    { id: 'area-rows-3', label: 'Rows 3', placement: 'secondary' },
    { id: 'area-rows-6', label: 'Rows 6', variant: 'primary', placement: 'secondary' }
  ];
  readonly inputNumberActions: ActionToolbarAction[] = [
    { id: 'number-decimal', label: 'Decimal', placement: 'secondary' },
    { id: 'number-currency', label: 'Currency', variant: 'primary', placement: 'secondary' }
  ];
  readonly passwordActions: ActionToolbarAction[] = [
    { id: 'password-feedback-on', label: 'Feedback On', placement: 'secondary' },
    { id: 'password-feedback-off', label: 'Feedback Off', variant: 'warning', placement: 'secondary' }
  ];
  readonly checkboxActions: ActionToolbarAction[] = [
    { id: 'checkbox-checked', label: 'Checked', variant: 'primary', placement: 'secondary' },
    { id: 'checkbox-unchecked', label: 'Unchecked', placement: 'secondary' }
  ];
  readonly datePickerActions: ActionToolbarAction[] = [
    { id: 'date-ddmmyy', label: 'dd/mm/yy', placement: 'secondary' },
    { id: 'date-mmddyy', label: 'mm-dd-yy', variant: 'primary', placement: 'secondary' }
  ];
  readonly selectActions: ActionToolbarAction[] = [
    { id: 'select-normal', label: 'Normal', placement: 'secondary' },
    { id: 'select-clear', label: 'Show Clear', variant: 'primary', placement: 'secondary' }
  ];
  readonly selectMultiActions: ActionToolbarAction[] = [
    { id: 'multi-filter-on', label: 'Filter On', placement: 'secondary' },
    { id: 'multi-filter-off', label: 'Filter Off', variant: 'warning', placement: 'secondary' }
  ];
  readonly selectTreeActions: ActionToolbarAction[] = [
    { id: 'tree-single', label: 'Single', placement: 'secondary' },
    { id: 'tree-multiple', label: 'Multiple', variant: 'primary', placement: 'secondary' },
    { id: 'tree-checkbox', label: 'Checkbox', placement: 'secondary' }
  ];
  readonly selectButtonActions: ActionToolbarAction[] = [
    { id: 'select-button-single', label: 'Single', placement: 'secondary' },
    { id: 'select-button-multiple', label: 'Multiple', variant: 'primary', placement: 'secondary' }
  ];
  readonly buttonActions: ActionToolbarAction[] = [
    { id: 'button-normal', label: 'Normal', placement: 'secondary' },
    { id: 'button-success', label: 'Success', variant: 'primary', placement: 'secondary' },
    { id: 'button-danger', label: 'Danger', variant: 'danger', placement: 'secondary' },
    { id: 'button-text', label: 'Text', placement: 'secondary' }
  ];
  readonly speedDialActions: ActionToolbarAction[] = [
    { id: 'speed-dial-linear', label: 'Linear', placement: 'secondary' },
    { id: 'speed-dial-circle', label: 'Circle', variant: 'primary', placement: 'secondary' }
  ];
  readonly candleModeActions: ActionToolbarAction[] = [
    { id: 'candle-once', label: 'Fetch once', placement: 'secondary' },
    { id: 'candle-polling', label: 'Polling', variant: 'primary', placement: 'secondary' },
    { id: 'candle-ws', label: 'WebSocket', placement: 'secondary' }
  ];
  readonly candleLayerActions: ActionToolbarAction[] = [
    { id: 'toggle-showCandles', label: 'Candles', placement: 'secondary' },
    { id: 'toggle-showLines', label: 'Lines', placement: 'secondary' },
    { id: 'toggle-showBoxAreas', label: 'Box areas', placement: 'secondary' },
    { id: 'toggle-showPoints', label: 'Points', placement: 'secondary' }
  ];
  readonly fileUploadActions: ActionToolbarAction[] = [
    { id: 'fileupload-basic', label: 'Basic', placement: 'secondary' },
    { id: 'fileupload-advanced', label: 'Advanced', variant: 'primary', placement: 'secondary' },
    { id: 'fileupload-single', label: 'Single', placement: 'secondary' },
    { id: 'fileupload-multiple', label: 'Multiple', variant: 'warning', placement: 'secondary' }
  ];

  fileUploadMode: 'basic' | 'advanced' = 'basic';
  fileUploadMultiple = false;

  candleMode: 'once' | 'polling' | 'ws' = 'once';
  candleConfig: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true,
  };

  private readonly validSections: DemoSection[] = [
    'input-text',
    'input-area',
    'input-number',
    'password',
    'check-box',
    'radio-button',
    'date-picker',
    'select',
    'select-multi',
    'select-tree',
    'select-button',
    'toggle-button',
    'toggle-switch',
    'button',
    'button-split',
    'button-speed-dial',
    'breadcrumb',
    'paginator',
    'fileupload',
    'candle-chart',
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

  get pageBreadcrumbItems(): Array<{ label: string; routerLink?: string | any[] }> {
    return this.breadcrumbItems.map((item) => ({
      label: String(item.label ?? ''),
      routerLink: item.routerLink
    }));
  }

  onDemoAction(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'text-normal':
        this.setTextPreset('normal');
        return;
      case 'text-error':
        this.setTextPreset('error');
        return;
      case 'area-rows-3':
        this.areaRows = 3;
        return;
      case 'area-rows-6':
        this.areaRows = 6;
        return;
      case 'number-decimal':
        this.setNumberPreset('decimal');
        return;
      case 'number-currency':
        this.setNumberPreset('currency');
        return;
      case 'password-feedback-on':
        this.passwordFeedback = true;
        return;
      case 'password-feedback-off':
        this.passwordFeedback = false;
        return;
      case 'checkbox-checked':
        this.checkboxValue = true;
        return;
      case 'checkbox-unchecked':
        this.checkboxValue = false;
        return;
      case 'date-ddmmyy':
        this.dateFormat = 'dd/mm/yy';
        return;
      case 'date-mmddyy':
        this.dateFormat = 'mm-dd-yy';
        return;
      case 'select-normal':
        this.setSelectPreset('normal');
        return;
      case 'select-clear':
        this.setSelectPreset('clear');
        return;
      case 'multi-filter-on':
        this.multiEnableFilter = true;
        return;
      case 'multi-filter-off':
        this.multiEnableFilter = false;
        return;
      case 'tree-single':
        this.setTreeMode('single');
        return;
      case 'tree-multiple':
        this.setTreeMode('multiple');
        return;
      case 'tree-checkbox':
        this.setTreeMode('checkbox');
        return;
      case 'select-button-single':
        this.selectButtonMultiple = false;
        return;
      case 'select-button-multiple':
        this.selectButtonMultiple = true;
        return;
      case 'button-normal':
        this.setButtonPreset('normal');
        return;
      case 'button-success':
        this.setButtonPreset('success');
        return;
      case 'button-danger':
        this.setButtonPreset('danger');
        return;
      case 'button-text':
        this.setButtonPreset('text');
        return;
      case 'speed-dial-linear':
        this.setSpeedDialPreset('linear');
        return;
      case 'speed-dial-circle':
        this.setSpeedDialPreset('circle');
        return;
      case 'candle-once':
        this.setCandleMode('once');
        return;
      case 'candle-polling':
        this.setCandleMode('polling');
        return;
      case 'candle-ws':
        this.setCandleMode('ws');
        return;
      case 'toggle-showCandles':
        this.toggleCandleLayer('showCandles');
        return;
      case 'toggle-showLines':
        this.toggleCandleLayer('showLines');
        return;
      case 'toggle-showBoxAreas':
        this.toggleCandleLayer('showBoxAreas');
        return;
      case 'toggle-showPoints':
        this.toggleCandleLayer('showPoints');
        return;
      case 'fileupload-basic':
        this.fileUploadMode = 'basic';
        return;
      case 'fileupload-advanced':
        this.fileUploadMode = 'advanced';
        return;
      case 'fileupload-single':
        this.fileUploadMultiple = false;
        return;
      case 'fileupload-multiple':
        this.fileUploadMultiple = true;
        return;
      default:
        return;
    }
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

  onDateValueChange(value: Date | Date[] | null): void {
    this.dateValue = value instanceof Date ? value : null;
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

  onPageChange(state: AppPaginatorState): void {
    this.paginatorFirst = state.first ?? 0;
    this.paginatorRows = state.rows ?? 10;
  }

  toggleCandleLayer(layer: keyof CandleChartConfig): void {
    this.candleConfig = {
      ...this.candleConfig,
      [layer]: !this.candleConfig[layer],
    };
  }

  setCandleMode(mode: 'once' | 'polling' | 'ws'): void {
    this.candleMode = mode;
  }
}
