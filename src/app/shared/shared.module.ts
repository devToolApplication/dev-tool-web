import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';
import { SplitButtonModule } from 'primeng/splitbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreeSelectModule } from 'primeng/treeselect';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TextareaModule } from 'primeng/textarea';

import { Breadcrumb } from './component/breadcrumb/breadcrumb';
import { ButtonSpeedDial } from './component/button-speed-dial/button-speed-dial';
import { ButtonSplit } from './component/button-split/button-split';
import { Button } from './component/button/button';
import { CheckBox } from './component/check-box/check-box';
import { DatePicker } from './component/date-picker/date-picker';
import { Fileupload } from './component/fileupload/fileupload';
import { InputArea } from './component/input-area/input-area';
import { InputNumber } from './component/input-number/input-number';
import { InputText } from './component/input-text/input-text';
import { Paginator } from './component/paginator/paginator';
import { Password } from './component/password/password';
import { RadioButton } from './component/radio-button/radio-button';
import { SelectButton } from './component/select-button/select-button';
import { SelectMulti } from './component/select-multi/select-multi';
import { SelectTree } from './component/select-tree/select-tree';
import { Select } from './component/select/select';
import { ToggleButton } from './component/toggle-button/toggle-button';
import { ToggleSwitch } from './component/toggle-switch/toggle-switch';
import { FormInput } from './ui/form-input/form-input';
import { FieldRenderer } from './ui/form-input/component/field-renderer/field-renderer';
import {FloatLabel} from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';

const COMPONENTS = [
  Breadcrumb,
  ButtonSpeedDial,
  ButtonSplit,
  Button,
  CheckBox,
  DatePicker,
  Fileupload,
  InputArea,
  InputNumber,
  InputText,
  Paginator,
  Password,
  RadioButton,
  SelectButton,
  SelectMulti,
  SelectTree,
  Select,
  ToggleButton,
  ToggleSwitch
];

const UI = [
  FormInput
]

const UI_COMPONENT = [
  FieldRenderer
]

@NgModule({
  declarations: [...COMPONENTS, ...UI, ...UI_COMPONENT],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SpeedDialModule,
    SplitButtonModule,
    CheckboxModule,
    DatePickerModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    PaginatorModule,
    PasswordModule,
    RadioButtonModule,
    SelectButtonModule,
    MultiSelectModule,
    TreeSelectModule,
    SelectModule,
    ToggleButtonModule,
    ToggleSwitchModule,
    BreadcrumbModule,
    TextareaModule,
    FloatLabel,
    FluidModule
  ],
  exports: [...COMPONENTS, ...UI, ...UI_COMPONENT]
})
export class SharedModule {}
