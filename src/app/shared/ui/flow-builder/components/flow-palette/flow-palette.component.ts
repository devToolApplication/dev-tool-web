import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlowNodeTypeDefinition, FlowPaletteConfig } from '../../models';

export const FLOW_NODE_DRAG_TYPE = 'application/x-flow-node-type';

@Component({
  selector: 'app-flow-palette',
  standalone: false,
  templateUrl: './flow-palette.component.html',
  styleUrls: ['./flow-palette.component.css'],
})
export class FlowPaletteComponent {
  @Input() nodeTypes: FlowNodeTypeDefinition[] = [];
  @Input() config: FlowPaletteConfig = { visible: true };

  @Output() readonly nodeTypeAdd = new EventEmitter<string>();

  get visibleNodeTypes(): FlowNodeTypeDefinition[] {
    const allowed = this.config.allowedTypes?.length ? new Set(this.config.allowedTypes) : null;
    return this.nodeTypes.filter(type => !allowed || allowed.has(type.type));
  }

  onDragStart(event: DragEvent, type: FlowNodeTypeDefinition): void {
    event.dataTransfer?.setData(FLOW_NODE_DRAG_TYPE, type.type);
    event.dataTransfer?.setData('text/plain', type.type);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
