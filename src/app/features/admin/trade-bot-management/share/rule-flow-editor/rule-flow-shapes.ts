import * as joint from '@joint/core';
import { RULE_FLOW_COLORS, RULE_FLOW_DIMENSIONS, RuleFlowNodeCategory } from './rule-flow-editor.models';

const { nodeWidth, nodeHeight, portRadius } = RULE_FLOW_DIMENSIONS;

const portMarkup = [
  {
    tagName: 'circle',
    selector: 'portBody',
    attributes: { r: portRadius, fill: '#fff', stroke: '#64748b', 'stroke-width': 2 },
  },
];

const inPortGroup: joint.dia.Element.PortGroup = {
  position: { name: 'top' },
  attrs: { portBody: { magnet: 'passive' } },
  markup: portMarkup,
};

const outPortGroup: joint.dia.Element.PortGroup = {
  position: { name: 'bottom' },
  attrs: { portBody: { magnet: true } },
  markup: portMarkup,
};

const outTruePortGroup: joint.dia.Element.PortGroup = {
  position: { name: 'bottom', args: { dx: -30 } },
  attrs: { portBody: { magnet: true, fill: '#22c55e' } },
  markup: portMarkup,
  label: { position: { name: 'bottom' }, markup: [{ tagName: 'text', selector: 'label' }] },
};

const outFalsePortGroup: joint.dia.Element.PortGroup = {
  position: { name: 'bottom', args: { dx: 30 } },
  attrs: { portBody: { magnet: true, fill: '#ef4444' } },
  markup: portMarkup,
  label: { position: { name: 'bottom' }, markup: [{ tagName: 'text', selector: 'label' }] },
};

function baseAttrs(color: string) {
  return {
    body: {
      width: nodeWidth,
      height: nodeHeight,
      rx: 8,
      ry: 8,
      fill: '#ffffff',
      stroke: color,
      strokeWidth: 2,
    },
    label: {
      textVerticalAnchor: 'middle',
      textAnchor: 'middle',
      x: nodeWidth / 2,
      y: nodeHeight / 2,
      fontSize: 13,
      fontFamily: 'Inter, sans-serif',
      fill: '#1e293b',
    },
  };
}

const baseMarkup = [
  { tagName: 'rect', selector: 'body' },
  { tagName: 'text', selector: 'label' },
];

export class StartNode extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'rule.Start',
      size: { width: 50, height: 50 },
      attrs: {
        body: {
          cx: 25,
          cy: 25,
          r: 25,
          fill: RULE_FLOW_COLORS.start,
          stroke: '#16a34a',
          strokeWidth: 2,
        },
        label: {
          textVerticalAnchor: 'middle',
          textAnchor: 'middle',
          x: 25,
          y: 25,
          fontSize: 11,
          fill: '#ffffff',
          fontWeight: 'bold',
          text: 'START',
        },
      },
      ports: {
        groups: { out: outPortGroup },
        items: [{ id: 'out', group: 'out' }],
      },
    };
  }

  override markup = [
    { tagName: 'circle', selector: 'body' },
    { tagName: 'text', selector: 'label' },
  ];
}

export class GroupNode extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'rule.Group',
      size: { width: nodeWidth, height: nodeHeight },
      attrs: baseAttrs(RULE_FLOW_COLORS.group),
      ports: {
        groups: { in: inPortGroup, out: outPortGroup },
        items: [
          { id: 'in', group: 'in' },
          { id: 'out', group: 'out' },
        ],
      },
    };
  }

  override markup = baseMarkup;
}

export class ConditionNode extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'rule.Condition',
      size: { width: nodeWidth, height: nodeHeight },
      attrs: baseAttrs(RULE_FLOW_COLORS.condition),
      ports: {
        groups: { in: inPortGroup, 'out-true': outTruePortGroup, 'out-false': outFalsePortGroup },
        items: [
          { id: 'in', group: 'in' },
          { id: 'out-true', group: 'out-true' },
          { id: 'out-false', group: 'out-false' },
        ],
      },
    };
  }

  override markup = baseMarkup;
}

export class RuleRefNode extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'rule.RuleRef',
      size: { width: nodeWidth, height: nodeHeight },
      attrs: baseAttrs(RULE_FLOW_COLORS.ruleRef),
      ports: {
        groups: { in: inPortGroup, out: outPortGroup },
        items: [
          { id: 'in', group: 'in' },
          { id: 'out', group: 'out' },
        ],
      },
    };
  }

  override markup = baseMarkup;
}

export class NotNode extends joint.dia.Element {
  override defaults() {
    return {
      ...super.defaults,
      type: 'rule.Not',
      size: { width: 60, height: 60 },
      attrs: {
        body: {
          cx: 30,
          cy: 30,
          r: 30,
          fill: '#ffffff',
          stroke: RULE_FLOW_COLORS.not,
          strokeWidth: 2,
        },
        label: {
          textVerticalAnchor: 'middle',
          textAnchor: 'middle',
          x: 30,
          y: 30,
          fontSize: 18,
          fontWeight: 'bold',
          fill: RULE_FLOW_COLORS.not,
          text: 'NOT',
        },
      },
      ports: {
        groups: { in: inPortGroup, out: outPortGroup },
        items: [
          { id: 'in', group: 'in' },
          { id: 'out', group: 'out' },
        ],
      },
    };
  }

  override markup = [
    { tagName: 'circle', selector: 'body' },
    { tagName: 'text', selector: 'label' },
  ];
}

export function createFlowShape(category: RuleFlowNodeCategory, label: string): joint.dia.Element {
  switch (category) {
    case 'start':
      return new StartNode();
    case 'group':
      return new GroupNode({ attrs: { label: { text: label } } });
    case 'condition':
      return new ConditionNode({ attrs: { label: { text: label } } });
    case 'ruleRef':
      return new RuleRefNode({ attrs: { label: { text: label } } });
    case 'not':
      return new NotNode();
  }
}

export function createFlowLink(sourceId: string, sourcePort: string, targetId: string, targetPort: string): joint.dia.Link {
  return new joint.shapes.standard.Link({
    source: { id: sourceId, port: sourcePort },
    target: { id: targetId, port: targetPort },
    attrs: {
      line: {
        stroke: '#94a3b8',
        strokeWidth: 2,
        targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: '#94a3b8' },
      },
    },
    router: { name: 'manhattan' },
    connector: { name: 'rounded' },
  });
}
