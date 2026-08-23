import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { FlowBuilderModule } from '@shared/ui/patterns/flow-builder/flow-builder.module';

import { WorkflowCanvasComponent } from './canvas/workflow-canvas.component';
import { AiGateInspectorComponent } from './inspector/ai-gate-inspector.component';
import { CodeGateInspectorComponent } from './inspector/code-gate-inspector.component';
import { EndInspectorComponent } from './inspector/end-inspector.component';
import { LogicInspectorComponent } from './inspector/logic-inspector.component';
import { StartInspectorComponent } from './inspector/start-inspector.component';
import { WorkflowNodeInspectorComponent } from './inspector/workflow-node-inspector.component';
import { AiGateNodeComponent } from './nodes/ai-gate-node.component';
import { CodeGateNodeComponent } from './nodes/code-gate-node.component';
import { EndNodeComponent } from './nodes/end-node.component';
import { LogicNodeComponent } from './nodes/logic-node.component';
import { StartNodeComponent } from './nodes/start-node.component';
import { WorkflowNodeShellComponent } from './nodes/workflow-node-shell.component';
import { WorkflowBuilderPageComponent } from './pages/workflow-builder-page.component';
import { WorkflowListPageComponent } from './pages/workflow-list-page.component';
import { WorkflowRunDialogComponent } from './pages/workflow-run-dialog.component';
import { WorkflowRunDetailPageComponent } from './pages/workflow-run-detail-page.component';
import { WorkflowRunListPageComponent } from './pages/workflow-run-list-page.component';
import { WorkflowProblemsPanelComponent } from './problems/workflow-problems-panel.component';
import { WorkflowLayoutService } from './services/workflow-layout.service';
import { WorkflowEditorStore } from './store/workflow-editor.store';

const DECLARATIONS = [
  WorkflowCanvasComponent,
  WorkflowNodeShellComponent,
  StartNodeComponent,
  CodeGateNodeComponent,
  AiGateNodeComponent,
  LogicNodeComponent,
  EndNodeComponent,
  WorkflowNodeInspectorComponent,
  AiGateInspectorComponent,
  CodeGateInspectorComponent,
  LogicInspectorComponent,
  StartInspectorComponent,
  EndInspectorComponent,
  WorkflowProblemsPanelComponent,
  WorkflowListPageComponent,
  WorkflowBuilderPageComponent,
  WorkflowRunDialogComponent,
  WorkflowRunListPageComponent,
  WorkflowRunDetailPageComponent,
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, FlowBuilderModule, SharedModule],
  providers: [WorkflowEditorStore, WorkflowLayoutService],
})
export class WorkflowStudioModule {}
