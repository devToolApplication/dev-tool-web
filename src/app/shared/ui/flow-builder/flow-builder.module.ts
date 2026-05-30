import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { FlowBuilderComponent } from './components/flow-builder/flow-builder.component';
import { FlowCanvasComponent } from './components/flow-canvas/flow-canvas.component';
import { FlowNavigatorComponent } from './components/flow-navigator/flow-navigator.component';
import { FlowPaletteComponent } from './components/flow-palette/flow-palette.component';
import { FlowInspectorFormPanelComponent } from './components/flow-inspector/flow-inspector-form-panel.component';
import { FlowNodeOverlayHostComponent } from './components/flow-node-overlay-host/flow-node-overlay-host.component';
import { FlowCommonTemplatesComponent } from './templates/flow-common-templates.component';
import {
  FlowNodeTemplateDirective,
  FlowEdgeTemplateDirective,
  FlowInspectorTemplateDirective,
  FlowToolbarTemplateDirective,
} from './directives/flow-template.directives';

const DECLARATIONS = [
  FlowBuilderComponent,
  FlowCanvasComponent,
  FlowNavigatorComponent,
  FlowPaletteComponent,
  FlowInspectorFormPanelComponent,
  FlowNodeOverlayHostComponent,
  FlowCommonTemplatesComponent,
  FlowNodeTemplateDirective,
  FlowEdgeTemplateDirective,
  FlowInspectorTemplateDirective,
  FlowToolbarTemplateDirective,
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, SharedModule],
  exports: DECLARATIONS,
})
export class FlowBuilderModule {}
