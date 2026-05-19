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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Breadcrumb } from './component/breadcrumb/breadcrumb';
import { BaseCrudPageComponent } from './ui/base-crud-page/base-crud-page.component';
import { BasePopupComponent } from './component/base-popup/base-popup.component';
import { AutoComplete } from './component/auto-complete/auto-complete';
import { ButtonSpeedDial } from './component/button-speed-dial/button-speed-dial';
import { ButtonSplit } from './component/button-split/button-split';
import { Button } from './component/button/button';
import { JsonPreviewComponent } from './component/json-preview/json-preview.component';
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
import { BaseLayoutComponent } from './layout/base/base.layout';
import { HeaderComponent } from './layout/header/header.component';
import { PageComponent } from './layout/page/page.component';
import { SideMenuComponent } from './layout/side-menu/side-menu.component';
import { TranslateContentPipe } from './pipe/translate-content.pipe';
import { FieldArrayRenderer } from './ui/form-input/component/field-array-renderer/field-array-renderer';
import { FieldBlockComponent } from './ui/form-input/component/field-block/field-block';
import { FieldGroupRenderer } from './ui/form-input/component/field-group-renderer/field-group-renderer';
import { FormSectionCardComponent } from './ui/form-input/component/form-section-card/form-section-card';
import { FormSectionNavComponent } from './ui/form-input/component/form-section-nav/form-section-nav';
import { FormStatusPanelComponent } from './ui/form-input/component/form-status-panel/form-status-panel';
import { FieldRecordRenderer } from './ui/form-input/component/field-record-renderer/field-record-renderer';
import { FieldRenderer } from './ui/form-input/component/field-renderer/field-renderer';
import { FieldSecretMetadataRendererComponent } from './ui/form-input/component/field-secret-metadata-renderer/field-secret-metadata-renderer';
import { FieldTreeRendererComponent } from './ui/form-input/component/field-tree-renderer/field-tree-renderer';
import { FormInput } from './ui/form-input/form-input';
import { JsonFieldBlockComponent } from './ui/form-input/component/json-field-block/json-field-block';
import { ReadonlyFieldComponent } from './ui/form-input/component/readonly-field/readonly-field';
import { ReadonlySectionComponent } from './ui/form-input/component/readonly-section/readonly-section';
import { SmartFormShellComponent } from './ui/form-input/component/smart-form-shell/smart-form-shell';
import { StickyFormActionsComponent } from './ui/form-input/component/sticky-form-actions/sticky-form-actions';
import { FieldGuidePanelComponent } from './ui/field-guide-panel/field-guide-panel.component';
import { CardComponent } from './ui/card/card.component';
import { SummaryMetricCardComponent } from './ui/summary-metric-card/summary-metric-card.component';
import { RealtimeProgressBarComponent } from './ui/realtime-progress-bar/realtime-progress-bar.component';
import { TableCellComponent } from './ui/table/component/table/table-cell/table-cell';
import { TableFilterComponent } from './ui/table/component/table/table-filter/table-filter';
import { TableComponent } from './ui/table/component/table/table';
import { EmptyStateComponent } from './ui/feedback/empty-state/empty-state.component';
import { ErrorStateComponent } from './ui/feedback/error-state/error-state.component';
import { LoadingSkeletonComponent } from './ui/feedback/loading-skeleton/loading-skeleton.component';
import { SkeletonCardComponent } from './ui/feedback/skeleton-card/skeleton-card.component';
import { SkeletonFormComponent } from './ui/feedback/skeleton-form/skeleton-form.component';
import { SkeletonTableComponent } from './ui/feedback/skeleton-table/skeleton-table.component';
import { AlertComponent } from './ui/feedback/alert/alert.component';
import { ConfirmDialogHostComponent } from './ui/overlay/confirm-dialog/confirm-dialog-host.component';
import { DrawerComponent } from './ui/overlay/drawer/drawer.component';
import { PageHeaderComponent } from './ui/layout/page-header/page-header.component';
import { PageShellComponent } from './ui/layout/page-shell/page-shell.component';
import { SectionPanelComponent } from './ui/layout/section-panel/section-panel.component';
import { FilterPanelComponent } from './ui/layout/filter-panel/filter-panel.component';
import { ActionToolbarComponent } from './ui/layout/action-toolbar/action-toolbar.component';
import { BadgeComponent } from './ui/data-display/badge/badge.component';
import { CopyableTextComponent } from './ui/data-display/copyable-text/copyable-text.component';
import { JsonViewerComponent } from './ui/data-display/json-viewer/json-viewer.component';
import { KeyValueListComponent } from './ui/data-display/key-value-list/key-value-list.component';
import { DiffViewerComponent } from './ui/data-display/diff-viewer/diff-viewer.component';
import { TimelineComponent as SharedTimelineComponent } from './ui/data-display/timeline/timeline.component';
import { ValueDisplayComponent } from './ui/data-display/value-display/value-display.component';
import { ValidationSummaryComponent } from './ui/forms/validation-summary/validation-summary.component';
import { ConfigTemplateFormComponent } from './ui/forms/config-template-form/config-template-form.component';

const PIPE = [TranslateContentPipe];

const ACTION_COMPONENTS = [
  ButtonSpeedDial,
  ButtonSplit,
  Button
];

const FORM_CONTROL_COMPONENTS = [
  AutoComplete,
  CheckBox,
  DatePicker,
  Fileupload,
  InputArea,
  InputMulti,
  InputNumber,
  InputText,
  Password,
  RadioButton,
  SelectButton,
  SelectMulti,
  SelectTree,
  Select,
  ToggleButton,
  ToggleSwitch
];

const NAVIGATION_COMPONENTS = [
  Breadcrumb,
  Paginator,
  TabsComponent
];

const DATA_DISPLAY_COMPONENTS = [
  JsonPreviewComponent,
  PanelComponent,
  PrimeTableComponent,
  Tag,
  TimelineComponent
];

const FEEDBACK_OVERLAY_COMPONENTS = [
  BasePopupComponent,
  ProgressSpinnerComponent
];

const COMPONENTS = [
  ...ACTION_COMPONENTS,
  ...FORM_CONTROL_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
  ...DATA_DISPLAY_COMPONENTS,
  ...FEEDBACK_OVERLAY_COMPONENTS
];

const UI = [
  BaseCrudPageComponent,
  FormInput,
  TableComponent,
  FieldGuidePanelComponent,
  CardComponent,
  SummaryMetricCardComponent,
  RealtimeProgressBarComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingSkeletonComponent,
  SkeletonTableComponent,
  SkeletonFormComponent,
  SkeletonCardComponent,
  AlertComponent,
  ConfirmDialogHostComponent,
  DrawerComponent,
  PageHeaderComponent,
  PageShellComponent,
  SectionPanelComponent,
  FilterPanelComponent,
  ActionToolbarComponent,
  BadgeComponent,
  CopyableTextComponent,
  JsonViewerComponent,
  KeyValueListComponent,
  DiffViewerComponent,
  SharedTimelineComponent,
  ValueDisplayComponent,
  ValidationSummaryComponent,
  ConfigTemplateFormComponent
];
const UI_COMPONENT = [
  SmartFormShellComponent,
  FormSectionNavComponent,
  FormSectionCardComponent,
  FieldBlockComponent,
  FormStatusPanelComponent,
  StickyFormActionsComponent,
  ReadonlyFieldComponent,
  ReadonlySectionComponent,
  JsonFieldBlockComponent,
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
  declarations: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...PIPE],
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
    ConfirmDialogModule,
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
  exports: [...COMPONENTS, ...UI, ...UI_COMPONENT, ...LAYOUT, ...PIPE]
})
export class SharedModule {}
