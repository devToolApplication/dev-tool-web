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
import { MessageModule } from 'primeng/message';
import { FieldsetModule } from 'primeng/fieldset';
import { TableModule } from 'primeng/table';
import { PanelMenuModule } from 'primeng/panelmenu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { AvatarModule } from 'primeng/avatar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TabsModule } from 'primeng/tabs';

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
import { AppTranslatePipe } from './component/app-translate.pipe';
import { FormInput } from './ui/form-input/form-input';
import { FieldRenderer } from './ui/form-input/component/field-renderer/field-renderer';
import {FloatLabel} from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { FieldArrayRenderer } from './ui/form-input/component/field-array-renderer/field-array-renderer';
import { FieldGroupRenderer } from './ui/form-input/component/field-group-renderer/field-group-renderer';
import { TableComponent } from './ui/table/table';
import { TableCellComponent } from './ui/table/component/table-cell/table-cell';
import { BaseLayoutComponent } from './layout/base/base.layout';
import { RouterModule } from '@angular/router';
import { DemoComponent } from '../features/demo/demo.component';
import { MailComponent } from '../features/mail/mail.component';
import { ReportsComponent } from '../features/reports/reports.component';
import { ProfileComponent } from '../features/profile/profile.component';
import { SettingsComponent } from '../features/settings/settings.component';
import { DashboardComponent } from '../features/dashboard/dashboard.component';
import { AiAgentDashboardComponent } from '../features/dashboard/components/ai-agent-dashboard/ai-agent-dashboard.component';
import { TradeBotDashboardComponent } from '../features/dashboard/components/trade-bot-dashboard/trade-bot-dashboard.component';
import { FileStorageDashboardComponent } from '../features/dashboard/components/file-storage-dashboard/file-storage-dashboard.component';
import { ForbiddenComponent } from '../features/error/forbidden/forbidden.component';
import { NotFoundComponent } from '../features/error/not-found/not-found.component';
import { SideMenuComponent } from './layout/side-menu/side-menu.component';
import { HeaderComponent } from './layout/header/header.component';
import { PageComponent } from './layout/page/page.component';

const FEATURE = [
  DemoComponent,
  MailComponent,
  ReportsComponent,
  ProfileComponent,
  SettingsComponent,
  DashboardComponent,
  AiAgentDashboardComponent,
  TradeBotDashboardComponent,
  FileStorageDashboardComponent,
  ForbiddenComponent,
  NotFoundComponent
]
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
  ToggleSwitch,
  AppTranslatePipe
];

const UI = [
  FormInput,
  TableComponent
]

const UI_COMPONENT = [
  FieldRenderer,
  FieldArrayRenderer,
  FieldGroupRenderer,
  TableCellComponent
]

const LAYOUT = [
  BaseLayoutComponent,
  SideMenuComponent,
  HeaderComponent,
  PageComponent
]
@NgModule({
  declarations: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...FEATURE],
  imports: [
    CommonModule,
    RouterModule,
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
    FluidModule,
    MessageModule,
    FieldsetModule,
    TableModule,
    PanelMenuModule,
    BadgeModule,
    RippleModule,
    ToastModule,
    ProgressSpinnerModule,
    ToolbarModule,
    AvatarModule,
    TieredMenuModule,
    TabsModule
  ],
  exports: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...FEATURE]
})
export class SharedModule {}
