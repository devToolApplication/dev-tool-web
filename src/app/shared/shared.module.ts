import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AvatarComponent } from './ui/primitives/avatar/avatar';
import { DialogComponent } from './ui/primitives/dialog/dialog';
import { Breadcrumb } from './ui/primitives/breadcrumb/breadcrumb';
import { BasePopupComponent } from './ui/primitives/base-popup/base-popup.component';
import { AutoComplete } from './ui/primitives/auto-complete/auto-complete';
import { ButtonSpeedDial } from './ui/primitives/button-speed-dial/button-speed-dial';
import { ButtonSplit } from './ui/primitives/button-split/button-split';
import { Button } from './ui/primitives/button/button';
import { JsonPreviewComponent } from './ui/primitives/json-preview/json-preview.component';
import { CheckBox } from './ui/primitives/check-box/check-box';
import { DatePicker } from './ui/primitives/date-picker/date-picker';
import { Fileupload } from './ui/primitives/fileupload/fileupload';
import { FieldsetComponent } from './ui/primitives/fieldset/fieldset.component';
import { InputArea } from './ui/primitives/input-area/input-area';
import { InputMulti } from './ui/primitives/input-multi/input-multi';
import { InputNumber } from './ui/primitives/input-number/input-number';
import { InputText } from './ui/primitives/input-text/input-text';
import { ColorPicker } from './ui/primitives/color-picker/color-picker';
import { MessageComponent } from './ui/primitives/message/message';
import { Paginator } from './ui/primitives/paginator/paginator';
import { PanelComponent } from './ui/primitives/panel/panel.component';
import { Password } from './ui/primitives/password/password';
import { FluidComponent } from './ui/primitives/fluid/fluid';
import { IconFieldComponent } from './ui/primitives/icon-field/icon-field';
import { PanelMenuComponent } from './ui/primitives/panel-menu/panel-menu';
import { RippleComponent } from './ui/primitives/ripple/ripple';
import { TooltipComponent } from './ui/primitives/tooltip/tooltip';
import { ProgressSpinnerComponent } from './ui/primitives/progress-spinner/progress-spinner.component';
import { RadioButton } from './ui/primitives/radio-button/radio-button';
import { SelectButton } from './ui/primitives/select-button/select-button';
import { SelectMulti } from './ui/primitives/select-multi/select-multi';
import { SelectTree } from './ui/primitives/select-tree/select-tree';
import { SliderComponent } from './ui/primitives/slider/slider';
import { Select } from './ui/primitives/select/select';
import { TieredMenuComponent } from './ui/primitives/tiered-menu/tiered-menu';
import { TimelineComponent } from './ui/primitives/timeline-wrapper/timeline.component';
import { ToastComponent } from './ui/primitives/toast/toast';
import { ToolbarComponent } from './ui/primitives/toolbar/toolbar';
import { ToggleButton } from './ui/primitives/toggle-button/toggle-button';
import { ToggleSwitch } from './ui/primitives/toggle-switch/toggle-switch';
import { TabsComponent } from './ui/primitives/tabs/tabs.component';
import { Tag } from './ui/primitives/tag/tag';
import { TranslateContentPipe } from './pipes/translate-content.pipe';
import { FieldArrayRenderer } from './ui/patterns/form-input/component/field-array-renderer/field-array-renderer';
import { FieldBlockComponent } from './ui/patterns/form-input/component/field-block/field-block';
import { FieldGroupRenderer } from './ui/patterns/form-input/component/field-group-renderer/field-group-renderer';
import { FormSectionCardComponent } from './ui/patterns/form-input/component/form-section-card/form-section-card';
import { FormSectionNavComponent } from './ui/patterns/form-input/component/form-section-nav/form-section-nav';
import { FieldRecordRenderer } from './ui/patterns/form-input/component/field-record-renderer/field-record-renderer';
import { FieldRenderer } from './ui/patterns/form-input/component/field-renderer/field-renderer';
import { FieldSecretMetadataRendererComponent } from './ui/patterns/form-input/component/field-secret-metadata-renderer/field-secret-metadata-renderer';
import { FieldTreeRendererComponent } from './ui/patterns/form-input/component/field-tree-renderer/field-tree-renderer';
import { FormInput } from './ui/patterns/form-input/form-input';
import { JsonFieldBlockComponent } from './ui/patterns/form-input/component/json-field-block/json-field-block';
import { StickyFormActionsComponent } from './ui/patterns/form-input/component/sticky-form-actions/sticky-form-actions';
import { FieldGuidePanelComponent } from './ui/forms/field-guide-panel/field-guide-panel.component';
import { CardComponent } from './ui/layout/card/card.component';
import { SummaryMetricCardComponent } from './ui/data-display/summary-metric-card/summary-metric-card.component';
import { RealtimeProgressBarComponent } from './ui/feedback/realtime-progress-bar/realtime-progress-bar.component';
import { TableCellComponent } from './ui/patterns/table/component/table/table-cell/table-cell';
import { TableFilterComponent } from './ui/patterns/table/component/table/table-filter/table-filter';
import { TableComponent } from './ui/patterns/table/component/table/table';
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
import { ResponsiveGridComponent } from './ui/layout/responsive-grid/responsive-grid.component';
import { StatusListComponent } from './ui/data-display/status-list/status-list.component';
import { ErrorPageComponent } from './ui/feedback/error-page/error-page.component';

const PIPE = [TranslateContentPipe];

const ACTION_COMPONENTS = [
  ButtonSpeedDial,
  ButtonSplit,
  Button,
  RippleComponent,
  ToolbarComponent,
  TooltipComponent
];

const INPUT_COMPONENTS = [
  AutoComplete,
  CheckBox,
  DatePicker,
  Fileupload,
  InputArea,
  InputMulti,
  InputNumber,
  InputText,
  ColorPicker,
  MessageComponent,
  Password,
  RadioButton,
  SliderComponent,
  ToggleButton,
  ToggleSwitch
];

const SELECT_COMPONENTS = [
  Select,
  SelectButton,
  SelectMulti,
  SelectTree
];

const FORM_LAYOUT_COMPONENTS = [
  FieldsetComponent,
  FluidComponent,
  IconFieldComponent
];

const FORM_CONTROL_COMPONENTS = [
  ...INPUT_COMPONENTS,
  ...SELECT_COMPONENTS,
  ...FORM_LAYOUT_COMPONENTS
];

const NAVIGATION_COMPONENTS = [
  Breadcrumb,
  Paginator,
  TabsComponent,
  TieredMenuComponent,
  PanelMenuComponent
];

const DATA_DISPLAY_COMPONENTS = [
  AvatarComponent,
  JsonPreviewComponent,
  PanelComponent,
  Tag,
  TimelineComponent
];

const FEEDBACK_OVERLAY_COMPONENTS = [
  BasePopupComponent,
  DialogComponent,
  ProgressSpinnerComponent,
  ToastComponent
];

const PRIMITIVE_COMPONENTS = [
  ...ACTION_COMPONENTS,
  ...FORM_CONTROL_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
  ...DATA_DISPLAY_COMPONENTS,
  ...FEEDBACK_OVERLAY_COMPONENTS
];

const PAGE_COMPONENTS = [
  CardComponent,
  PageHeaderComponent,
  PageShellComponent,
  SectionPanelComponent,
  FilterPanelComponent,
  ActionToolbarComponent,
  ResponsiveGridComponent
];

const FEEDBACK_COMPONENTS = [
  EmptyStateComponent,
  ErrorStateComponent,
  LoadingSkeletonComponent,
  SkeletonTableComponent,
  SkeletonFormComponent,
  SkeletonCardComponent,
  AlertComponent,
  ErrorPageComponent
];

const DATA_VIEW_COMPONENTS = [
  BadgeComponent,
  CopyableTextComponent,
  JsonViewerComponent,
  KeyValueListComponent,
  DiffViewerComponent,
  SharedTimelineComponent,
  ValueDisplayComponent,
  StatusListComponent,
  SummaryMetricCardComponent,
  RealtimeProgressBarComponent
];

const OVERLAY_COMPONENTS = [
  ConfirmDialogHostComponent,
  DrawerComponent
];

const FORM_EXPERIENCE_COMPONENTS = [
    FormInput,
  ValidationSummaryComponent,
  ConfigTemplateFormComponent,
  FieldGuidePanelComponent
];

const UI = [
  ...FORM_EXPERIENCE_COMPONENTS,
  ...PAGE_COMPONENTS,
  ...FEEDBACK_COMPONENTS,
  ...DATA_VIEW_COMPONENTS,
  ...OVERLAY_COMPONENTS,
  TableComponent
];
const UI_COMPONENT = [
  FormSectionNavComponent,
  FormSectionCardComponent,
  FieldBlockComponent,
  StickyFormActionsComponent,
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
export const SHARED_PRIMITIVE_COMPONENTS = [
  ...PRIMITIVE_COMPONENTS
];

export const SHARED_UI_COMPONENTS = [
  ...UI,
  ...UI_COMPONENT
];

@NgModule({
  declarations: [...SHARED_PRIMITIVE_COMPONENTS, ...SHARED_UI_COMPONENTS, ...PIPE],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [...SHARED_PRIMITIVE_COMPONENTS, ...SHARED_UI_COMPONENTS, ...PIPE]
})
export class SharedModule {}





