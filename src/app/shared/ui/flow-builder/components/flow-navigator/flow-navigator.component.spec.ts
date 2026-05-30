import { FlowNavigatorComponent } from './flow-navigator.component';
import type { FlowDefinition, FlowNodeTypeDefinition, FlowViewportSnapshot } from '../../models';
import { computeFitTransform } from '../../joint/joint-flow-viewport';

describe('FlowNavigatorComponent', () => {
  it('clamps the viewport frame inside the minimap body when the canvas viewport is larger than the graph', () => {
    const component = new FlowNavigatorComponent();
    component.value = smallFlow();
    component.viewport = {
      scale: 1,
      translateX: -220,
      translateY: -140,
      clientWidth: 1200,
      clientHeight: 680,
      contentBounds: { minX: 0, minY: 0, width: 210, height: 120 },
      nodePositions: [
        { id: 'g1', x: 0, y: 0, width: 150, height: 78 },
        { id: 'c1', x: 60, y: 180, width: 210, height: 96 },
      ],
    };

    const style = component.viewportStyle();

    expect(style).toBeTruthy();
    expect(px(style?.['left'])).toBeGreaterThanOrEqual(0);
    expect(px(style?.['top'])).toBeGreaterThanOrEqual(0);
    expect(px(style?.['left']) + px(style?.['width'])).toBeLessThanOrEqual(component.mapWidth);
    expect(px(style?.['top']) + px(style?.['height'])).toBeLessThanOrEqual(component.bodyHeight);
  });

  it('keeps the viewport frame ratio from the canvas visible bounds', () => {
    const component = new FlowNavigatorComponent();
    component.value = smallFlow();
    component.viewport = {
      scale: 1,
      translateX: -120,
      translateY: -80,
      clientWidth: 900,
      clientHeight: 450,
      contentBounds: { minX: 0, minY: 0, width: 270, height: 276 },
      nodePositions: [
        { id: 'g1', x: 0, y: 0, width: 150, height: 78 },
        { id: 'c1', x: 60, y: 180, width: 210, height: 96 },
      ],
    };

    const style = component.viewportStyle();
    const ratio = px(style?.['width']) / px(style?.['height']);

    expect(ratio).toBeCloseTo(2, 1);
  });

  it('uses node label resolvers for readable minimap labels', () => {
    const component = new FlowNavigatorComponent();
    component.value = smallFlow();
    component.viewport = viewportForSmallFlow();
    component.nodeTypes = [
      {
        type: 'rule-group',
        label: 'Group',
        shape: 'html',
        defaultSize: { width: 150, height: 78 },
        ports: [],
        labelResolver: node => String(node.data?.['operator'] ?? 'GROUP'),
      } as FlowNodeTypeDefinition,
    ];

    expect(component.nodeMiniLabel(component.value.nodes[0])).toBe('AND');
  });

  it('renders a visible viewport frame for the single-node initial fit case', () => {
    const component = new FlowNavigatorComponent();
    const nodeBounds = { minX: 0, minY: 0, width: 220, height: 72 };
    const viewportSize = { width: 580, height: 520 };
    const transform = computeFitTransform(nodeBounds, viewportSize, { padding: 40, minScale: 0.3, maxScale: 1 });
    component.value = singleRuleRefFlow();
    component.viewport = {
      scale: transform.scale,
      translateX: transform.tx,
      translateY: transform.ty,
      clientWidth: viewportSize.width,
      clientHeight: viewportSize.height,
      contentBounds: nodeBounds,
      nodePositions: [{ id: 'r1', x: 0, y: 0, width: 220, height: 72 }],
    };

    const viewport = component.viewportStyle();
    const node = component.nodeStyle(component.value.nodes[0]);

    expect(px(viewport?.['width'])).toBeGreaterThan(100);
    expect(px(viewport?.['height'])).toBeGreaterThan(90);
    expect(px(node['left'])).toBeGreaterThan(px(viewport?.['left']));
    expect(px(node['top'])).toBeGreaterThan(px(viewport?.['top']));
  });

  it('does not collapse the viewport frame to minimum size when the visible canvas is above a node', () => {
    const component = new FlowNavigatorComponent();
    component.value = singleRuleRefFlow();
    component.viewport = {
      scale: 3,
      translateX: 0,
      translateY: 210,
      clientWidth: 580,
      clientHeight: 520,
      contentBounds: { minX: 0, minY: 0, width: 220, height: 72 },
      nodePositions: [{ id: 'r1', x: 0, y: 0, width: 220, height: 72 }],
    };

    const viewport = component.viewportStyle();

    expect(px(viewport?.['width'])).toBeGreaterThan(50);
    expect(px(viewport?.['height'])).toBeGreaterThan(40);
  });
});

function smallFlow(): FlowDefinition {
  return {
    id: 'flow',
    version: 1,
    nodes: [
      { id: 'g1', type: 'rule-group', label: 'Group', data: { operator: 'AND' }, size: { width: 150, height: 78 }, position: { x: 0, y: 0 } },
      { id: 'c1', type: 'rule-condition', label: 'GT', data: { operator: 'GT' }, size: { width: 210, height: 96 }, position: { x: 60, y: 180 } },
    ],
    edges: [
      { id: 'e1', source: { nodeId: 'g1' }, target: { nodeId: 'c1' } },
    ],
  };
}

function singleRuleRefFlow(): FlowDefinition {
  return {
    id: 'flow',
    version: 1,
    nodes: [
      {
        id: 'r1',
        type: 'rule-ref',
        label: 'Rule: TREND_IS_BEARISH_INTERNAL',
        data: { ruleCode: 'TREND_IS_BEARISH_INTERNAL' },
        size: { width: 220, height: 72 },
        position: { x: 0, y: 0 },
      },
    ],
    edges: [],
  };
}

function viewportForSmallFlow(): FlowViewportSnapshot {
  return {
    scale: 1,
    translateX: 0,
    translateY: 0,
    clientWidth: 300,
    clientHeight: 180,
    contentBounds: { minX: 0, minY: 0, width: 270, height: 276 },
    nodePositions: [
      { id: 'g1', x: 0, y: 0, width: 150, height: 78 },
      { id: 'c1', x: 60, y: 180, width: 210, height: 96 },
    ],
  };
}

function px(value: string | undefined): number {
  return Number(String(value ?? '0').replace('px', ''));
}
