import { createEdgeShape, createNodeShape } from './joint-flow-renderer';

describe('joint-flow-renderer', () => {
  it('adds stable test hooks to rendered nodes and edges', () => {
    const node = createNodeShape({ id: 'ai-gate-1', type: 'AI_GATE', label: 'AI Gate' });
    const edge = createEdgeShape({
      id: 'start-1__ai-gate-1',
      source: { nodeId: 'start-1', portId: 'out' },
      target: { nodeId: 'ai-gate-1', portId: 'in' },
    });

    expect(node.attr('root/data-testid')).toBe('flow-node-ai-gate-1');
    expect(node.attr('root/data-node-id')).toBe('ai-gate-1');
    expect(node.attr('root/data-node-type')).toBe('AI_GATE');
    expect(edge.attr('root/data-testid')).toBe('flow-edge-start-1__ai-gate-1');
    expect(edge.attr('root/data-edge-id')).toBe('start-1__ai-gate-1');
  });
});
