import { Injectable } from '@angular/core';

import {
  WorkflowGraph,
  WorkflowNodePosition,
} from '../model/workflow-studio.model';

const X_GAP = 280;
const Y_GAP = 120;

@Injectable()
export class WorkflowLayoutService {
  async layout(
    graph: WorkflowGraph,
    existingPositions: Record<string, WorkflowNodePosition> = {},
  ): Promise<Record<string, WorkflowNodePosition>> {
    // ponytail: linear fallback; replace with ELK when branch-heavy graphs need stable ranks.
    return Object.fromEntries(
      graph.nodes.map((node, index) => [
        node.id,
        existingPositions[node.id]
          ? { ...existingPositions[node.id] }
          : { x: index * X_GAP, y: index * Y_GAP },
      ]),
    );
  }
}
