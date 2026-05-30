import { FlowDefinition } from '../models';
import { FlowDiagramData } from './flow-diagram-data';

describe('FlowDiagramData', () => {
  const definition: FlowDefinition = {
    id: 'flow',
    version: 1,
    nodes: [
      { id: 'a', type: 'node', position: { x: 10, y: 20 } },
      { id: 'b', type: 'node', position: { x: 120, y: 20 } },
    ],
    edges: [
      {
        id: 'edge-a-b',
        source: { nodeId: 'a', portId: 'out' },
        target: { nodeId: 'b', portId: 'in' },
      },
    ],
  };

  it('removes selected nodes and connected edges together', () => {
    const updated = FlowDiagramData.from(definition).removeSelection(['a']);

    expect(updated.nodes.map(node => node.id)).toEqual(['b']);
    expect(updated.edges).toEqual([]);
  });

  it('duplicates selected nodes with internal edges only', () => {
    const result = FlowDiagramData.from(definition).duplicateSelection(['a', 'b']);

    expect(result.duplicatedIds).toEqual(['a-copy', 'b-copy']);
    expect(result.definition.nodes.map(node => node.id)).toEqual(['a', 'b', 'a-copy', 'b-copy']);
    expect(result.definition.edges.at(-1)).toMatchObject({
      source: { nodeId: 'a-copy', portId: 'out' },
      target: { nodeId: 'b-copy', portId: 'in' },
    });
  });
});
