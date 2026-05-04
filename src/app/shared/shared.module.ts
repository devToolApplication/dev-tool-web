import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabel } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { PanelMenuModule } from 'primeng/panelmenu';
import { PaginatorModule } from 'primeng/paginator';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { SpeedDialModule } from 'primeng/speeddial';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { TreeSelectModule } from 'primeng/treeselect';
import { CheckboxModule } from 'primeng/checkbox';
import { Breadcrumb } from './component/breadcrumb/breadcrumb';
import { BaseCrudPageComponent } from './ui/base-crud-page/base-crud-page.component';
import { BasePopupComponent } from './component/base-popup/base-popup.component';
import { BaseReplayControlsComponent } from './component/base-replay-controls/base-replay-controls.component';
import { AutoComplete } from './component/auto-complete/auto-complete';
import { ButtonSpeedDial } from './component/button-speed-dial/button-speed-dial';
import { ButtonSplit } from './component/button-split/button-split';
import { Button } from './component/button/button';
import { CandleChart } from './component/candle-chart/candle-chart';
import { JsonPreviewComponent } from './component/json-preview/json-preview.component';
import { TradeBotChartPreviewComponent } from './component/trade-bot-chart-preview/trade-bot-chart-preview.component';
import { CheckBox } from './component/check-box/check-box';
import { DatePicker } from './component/date-picker/date-picker';
import { Fileupload } from './component/fileupload/fileupload';
import { InputArea } from './component/input-area/input-area';
import { InputMulti } from './component/input-multi/input-multi';
import { InputNumber } from './component/input-number/input-number';
import { InputText } from './component/input-text/input-text';
import { Paginator } from './component/paginator/paginator';
import { PanelComponent } from './component/panel/panel.component';
import { Password } from './component/password/password';
import { PrimeTableComponent } from './component/prime-table/prime-table.component';
import { ProgressSpinnerComponent } from './component/progress-spinner/progress-spinner.component';
import { RadioButton } from './component/radio-button/radio-button';
import { SelectButton } from './component/select-button/select-button';
import { SelectMulti } from './component/select-multi/select-multi';
import { SelectTree } from './component/select-tree/select-tree';
import { Select } from './component/select/select';
import { ToggleButton } from './component/toggle-button/toggle-button';
import { ToggleSwitch } from './component/toggle-switch/toggle-switch';
import { TimelineComponent } from './component/timeline-wrapper/timeline.component';
import { TabsComponent } from './component/tabs/tabs.component';
import { Tag } from './component/tag/tag';
import { DashboardComponent } from '../features/dashboard/dashboard.component';
import { DashboardChartComponent } from '../features/dashboard/components/dashboard-chart/dashboard-chart.component';
import { AiAgentDashboardComponent } from '../features/dashboard/components/ai-agent-dashboard/ai-agent-dashboard.component';
import { FileStorageDashboardComponent } from '../features/dashboard/components/file-storage-dashboard/file-storage-dashboard.component';
import { TradeBotDashboardComponent } from '../features/dashboard/components/trade-bot-dashboard/trade-bot-dashboard.component';
import { DemoComponent } from '../features/demo/demo.component';
import { ForbiddenComponent } from '../features/error/forbidden/forbidden.component';
import { NotFoundComponent } from '../features/error/not-found/not-found.component';
import { FeaturePlaceholderComponent } from '../features/feature-placeholder/feature-placeholder.component';
import { SettingsComponent } from '../features/settings/settings.component';
import { AI_AGENT_FEATURE_COMPONENTS } from '../features/admin/ai-agent/ai-agent.feature';
import { FILE_STORAGE_FEATURE_COMPONENTS } from '../features/admin/file-storage-management/file-storage-management.feature';
import { SYSTEM_MANAGEMENT_FEATURE_COMPONENTS } from '../features/admin/system-management/system-management.feature';
import { TRADE_BOT_FEATURE_COMPONENTS } from '../features/admin/trade-bot-management/trade-bot-management.feature';
import { CODEX_AGENT_FEATURE_COMPONENTS } from '../features/admin/codex-agent/codex-agent.feature';
import { BaseLayoutComponent } from './layout/base/base.layout';
import { HeaderComponent } from './layout/header/header.component';
import { PageComponent } from './layout/page/page.component';
import { SideMenuComponent } from './layout/side-menu/side-menu.component';
import { TranslateContentPipe } from './pipe/translate-content.pipe';
import { FieldArrayRenderer } from './ui/form-input/component/field-array-renderer/field-array-renderer';
import { FieldGroupRenderer } from './ui/form-input/component/field-group-renderer/field-group-renderer';
import { FieldRecordRenderer } from './ui/form-input/component/field-record-renderer/field-record-renderer';
import { FieldRenderer } from './ui/form-input/component/field-renderer/field-renderer';
import { FieldSecretMetadataRendererComponent } from './ui/form-input/component/field-secret-metadata-renderer/field-secret-metadata-renderer';
import { FieldTreeRendererComponent } from './ui/form-input/component/field-tree-renderer/field-tree-renderer';
import { FormInput } from './ui/form-input/form-input';
import { FieldGuidePanelComponent } from './ui/field-guide-panel/field-guide-panel.component';
import { CardComponent } from './ui/card/card.component';
import { SummaryMetricCardComponent } from './ui/summary-metric-card/summary-metric-card.component';
import { TableCellComponent } from './ui/table/component/table/table-cell/table-cell';
import { TableFilterComponent } from './ui/table/component/table/table-filter/table-filter';
import { TableComponent } from './ui/table/component/table/table';

const PIPE = [TranslateContentPipe];

const FEATURE = [
  DemoComponent,
  SettingsComponent,
  DashboardComponent,
  DashboardChartComponent,
  AiAgentDashboardComponent,
  TradeBotDashboardComponent,
  FileStorageDashboardComponent,
  ForbiddenComponent,
  NotFoundComponent,
  FeaturePlaceholderComponent,
  ...AI_AGENT_FEATURE_COMPONENTS,
  ...FILE_STORAGE_FEATURE_COMPONENTS,
  ...SYSTEM_MANAGEMENT_FEATURE_COMPONENTS,
  ...TRADE_BOT_FEATURE_COMPONENTS,
  ...CODEX_AGENT_FEATURE_COMPONENTS
];

const COMPONENTS = [
  BaseCrudPageComponent,
  BasePopupComponent,
  BaseReplayControlsComponent,
  Breadcrumb,
  AutoComplete,
  ButtonSpeedDial,
  ButtonSplit,
  Button,
  CheckBox,
  DatePicker,
  Fileupload,
  InputArea,
  InputMulti,
  InputNumber,
  InputText,
  Paginator,
  PanelComponent,
  Password,
  PrimeTableComponent,
  ProgressSpinnerComponent,
  RadioButton,
  SelectButton,
  SelectMulti,
  SelectTree,
  Select,
  ToggleButton,
  ToggleSwitch,
  TabsComponent,
  Tag,
  CandleChart,
  JsonPreviewComponent,
  TradeBotChartPreviewComponent,
  TimelineComponent
];

const UI = [FormInput, TableComponent, FieldGuidePanelComponent, CardComponent, SummaryMetricCardComponent];
const UI_COMPONENT = [
  FieldRenderer,
  FieldArrayRenderer,
  FieldGroupRenderer,
  FieldRecordRenderer,
  FieldSecretMetadataRendererComponent,
  FieldTreeRendererComponent,
  TableCellComponent,
  TableFilterComponent
];
const LAYOUT = [BaseLayoutComponent, SideMenuComponent, HeaderComponent, PageComponent];

@NgModule({
  declarations: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...FEATURE, ...PIPE],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    SpeedDialModule,
    SplitButtonModule,
    CheckboxModule,
    DatePickerModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    DialogModule,
    PaginatorModule,
    PasswordModule,
    RadioButtonModule,
    SelectButtonModule,
    MultiSelectModule,
    PanelModule,
    TreeSelectModule,
    SelectModule,
    SliderModule,
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
    TagModule,
    ToolbarModule,
    AvatarModule,
    TieredMenuModule,
    TabsModule,
    TimelineModule,
    IconFieldModule,
    InputIconModule
  ],
  exports: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...FEATURE, ...PIPE]
})
export class SharedModule {}
