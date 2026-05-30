import { FlowNodeOverlayHostComponent } from './flow-node-overlay-host.component';
import type { FlowDefinition, FlowNodeTypeDefinition } from '../../models';

describe('FlowNodeOverlayHostComponent', () => {
  it('does not render html nodes without a data position or an engine viewport position', () => {
    const component = new FlowNodeOverlayHostComponent();
    component.nodeTypes = [htmlNodeType()];
    component.value = {
      id: 'flow',
      version: 1,
      nodes: [
        { id: 'n1', type: 'html-node', label: 'Node' },
      ],
      edges: [],
    } as FlowDefinition;

    expect(component.htmlNodes).toEqual([]);

    component.viewport = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      clientWidth: 800,
      clientHeight: 500,
      contentBounds: { minX: 0, minY: 0, width: 200, height: 80 },
      nodePositions: [{ id: 'n1', x: 120, y: 80, width: 200, height: 80 }],
    };

    expect(component.htmlNodes.map(node => node.id)).toEqual(['n1']);
    expect(component.nodeStyle(component.htmlNodes[0])).toEqual({
      left: '120px',
      top: '80px',
      width: '200px',
      height: '80px',
    });
  });

  it('uses the source node out port when adding a node from the plus menu', () => {
    const component = new FlowNodeOverlayHostComponent();
    component.nodeTypes = [
      { ...htmlNodeType(), ports: [{ id: 'custom-out', group: 'out', position: 'bottom' }] },
      { type: 'target-node', label: 'Target', shape: 'rectangle', defaultSize: { width: 160, height: 56 }, ports: [] },
    ];
    component.value = {
      id: 'flow',
      version: 1,
      nodes: [
        { id: 'n1', type: 'html-node', label: 'Node', position: { x: 10, y: 20 } },
      ],
      edges: [],
    } as FlowDefinition;

    const emitted: Array<{ sourceNodeId: string; sourcePortId: string; nodeType: string }> = [];
    component.addNodeFromPort.subscribe(event => emitted.push(event));
    component.addMenuNodeId = 'n1';

    component.selectAddType('n1', 'target-node');

    expect(emitted).toEqual([
      { sourceNodeId: 'n1', sourcePortId: 'custom-out', nodeType: 'target-node' },
    ]);
    expect(component.addMenuNodeId).toBeNull();
  });
});

function htmlNodeType(): FlowNodeTypeDefinition {
  return {
    type: 'html-node',
    label: 'HTML Node',
    shape: 'html',
    defaultSize: { width: 200, height: 80 },
    ports: [],
  };
}
