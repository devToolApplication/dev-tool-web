import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

import { WorkflowBpmnCanvasComponent } from './bpmn/workflow-bpmn-canvas.component';
import { AiGateInspectorComponent } from './inspector/ai-gate-inspector.component';
import { CodeGateInspectorComponent } from './inspector/code-gate-inspector.component';
import { EndInspectorComponent } from './inspector/end-inspector.component';
import { LogicInspectorComponent } from './inspector/logic-inspector.component';
import { StartInspectorComponent } from './inspector/start-inspector.component';
import { WorkflowEdgeInspectorComponent } from './inspector/workflow-edge-inspector.component';
import { WorkflowElementInspectorComponent } from './inspector/workflow-element-inspector.component';
import { WorkflowNodeInspectorComponent } from './inspector/workflow-node-inspector.component';
import { WorkflowInputMappingEditorComponent } from './inspector/fields/workflow-input-mapping-editor/workflow-input-mapping-editor.component';
import { WorkflowJsonObjectEditorComponent } from './inspector/fields/workflow-json-object-editor/workflow-json-object-editor.component';
import { AiGateNodeComponent } from './nodes/ai-gate-node.component';
import { CodeGateNodeComponent } from './nodes/code-gate-node.component';
import { EndNodeComponent } from './nodes/end-node.component';
import { LogicNodeComponent } from './nodes/logic-node.component';
import { StartNodeComponent } from './nodes/start-node.component';
import { WorkflowNodeShellComponent } from './nodes/workflow-node-shell.component';
import { WorkflowBuilderPageComponent } from './pages/workflow-builder-page.component';
import { WorkflowListPageComponent } from './pages/workflow-list-page.component';
import { WorkflowProblemsPanelComponent } from './problems/workflow-problems-panel.component';
import { WorkflowLayoutService } from './services/workflow-layout.service';
import { WorkflowEditorStore } from './store/workflow-editor.store';

const DECLARATIONS = [
  WorkflowBpmnCanvasComponent,
  WorkflowNodeShellComponent,
  StartNodeComponent,
  CodeGateNodeComponent,
  AiGateNodeComponent,
  LogicNodeComponent,
  EndNodeComponent,
  WorkflowNodeInspectorComponent,
  WorkflowEdgeInspectorComponent,
  WorkflowElementInspectorComponent,
  AiGateInspectorComponent,
  CodeGateInspectorComponent,
  LogicInspectorComponent,
  StartInspectorComponent,
  EndInspectorComponent,
  WorkflowInputMappingEditorComponent,
  WorkflowJsonObjectEditorComponent,
  WorkflowProblemsPanelComponent,
  WorkflowListPageComponent,
  WorkflowBuilderPageComponent,
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, SharedModule],
  providers: [WorkflowEditorStore, WorkflowLayoutService],
})
export class WorkflowStudioModule {}
