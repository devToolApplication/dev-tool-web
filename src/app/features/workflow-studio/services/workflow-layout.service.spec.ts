import { TestBed } from '@angular/core/testing';

import { WorkflowLayoutService } from './workflow-layout.service';
import { WorkflowGraph } from '../model/workflow-studio.model';

describe('WorkflowLayoutService', () => {
  let service: WorkflowLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkflowLayoutService],
    });

    service = TestBed.inject(WorkflowLayoutService);
  });

  it('returns stable positions for every workflow node without mutating the graph', async () => {
    const graph: WorkflowGraph = {
      nodes: [
        { id: 'start', type: 'START' },
        { id: 'logic', type: 'LOGIC', operator: 'AND', config: {} },
        { id: 'end', type: 'END' },
      ],
      edges: [
        { source: 'start', target: 'logic' },
        { source: 'logic', target: 'end' },
      ],
    };
    const original = JSON.parse(JSON.stringify(graph));

    const result = await service.layout(graph, { start: { x: 5, y: 6 } });

    expect(result).toEqual({
      start: { x: 5, y: 6 },
      logic: { x: 280, y: 120 },
      end: { x: 560, y: 240 },
    });
    expect(graph).toEqual(original);
  });
});
