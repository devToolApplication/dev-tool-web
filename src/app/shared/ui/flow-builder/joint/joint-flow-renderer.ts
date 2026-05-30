import * as joint from '@joint/core';
import { FlowNode, FlowEdge, FlowNodeTypeDefinition, FlowEdgeTypeDefinition, FlowNodeTone } from '../models';

const PORT_MARKUP = [{ tagName: 'circle', selector: 'portBody', attributes: { r: 5, fill: '#fff', stroke: 'var(--app-border-strong, var(--app-text-muted, #94a3b8))', 'stroke-width': 1.5 } }];

const FlowCardElement = joint.dia.Element.define('flowBuilder.Card', {}, {
  markup: [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'circle', selector: 'iconCircle' },
    { tagName: 'image', selector: 'icon' },
    { tagName: 'text', selector: 'iconLabel' },
    { tagName: 'text', selector: 'label' },
    { tagName: 'text', selector: 'subtitle' },
    { tagName: 'rect', selector: 'badgeBody' },
    { tagName: 'text', selector: 'badgeText' },
    { tagName: 'circle', selector: 'menuBody' },
    { tagName: 'circle', selector: 'menuDot1' },
    { tagName: 'circle', selector: 'menuDot2' },
    { tagName: 'circle', selector: 'menuDot3' },
  ],
});

const IN_PORT_GROUP: joint.dia.Element.PortGroup = {
  position: { name: 'top' },
  attrs: { portBody: { magnet: 'passive' } },
  markup: PORT_MARKUP,
};

const OUT_PORT_GROUP: joint.dia.Element.PortGroup = {
  position: { name: 'bottom' },
  attrs: { portBody: { magnet: true } },
  markup: PORT_MARKUP,
};

function toneToColor(tone?: string): string {
  switch (tone) {
    case 'primary': return 'var(--app-primary, #7a77ff)';
    case 'info': return 'var(--app-control-info-border, #3b82f6)';
    case 'success': return 'var(--app-control-success-border, #22c55e)';
    case 'warning': return 'var(--app-control-warn-border, #f97316)';
    case 'danger': return 'var(--app-control-danger-border, #ef4444)';
    case 'muted': return 'var(--app-text-muted, #94a3b8)';
    default: return 'var(--app-border, #d8dee8)';
  }
}

function buildPorts(typeDef?: FlowNodeTypeDefinition): { groups: Record<string, joint.dia.Element.PortGroup>; items: Array<{ id: string; group: string }> } {
  if (!typeDef?.ports?.length) {
    return {
      groups: { in: IN_PORT_GROUP, out: OUT_PORT_GROUP },
      items: [{ id: 'in', group: 'in' }, { id: 'out', group: 'out' }],
    };
  }

  const groups: Record<string, joint.dia.Element.PortGroup> = {};
  const items: Array<{ id: string; group: string }> = [];

  for (const port of typeDef.ports) {
    const posName = port.position || (port.group === 'in' ? 'top' : 'bottom');
    groups[port.id] = {
      position: { name: posName },
      attrs: { portBody: { magnet: port.group === 'in' ? 'passive' : true } },
      markup: PORT_MARKUP,
    };
    items.push({ id: port.id, group: port.id });
  }

  return { groups, items };
}

function resolveLabel(node: FlowNode, typeDef?: FlowNodeTypeDefinition): string {
  if (typeDef?.labelResolver) return typeDef.labelResolver(node);
  return node.label ?? typeDef?.label ?? node.type;
}

function resolveSubtitle(node: FlowNode, typeDef?: FlowNodeTypeDefinition): string {
  if (typeDef?.subtitleResolver) return typeDef.subtitleResolver(node);
  const subtitle = node.data?.['subtitle'];
  if (subtitle != null) return String(subtitle);
  const badge = node.data?.['badge'];
  return badge != null ? String(badge) : '';
}

function resolveBadge(node: FlowNode, typeDef?: FlowNodeTypeDefinition): { label: string; tone?: FlowNodeTone } | null {
  const resolved = typeDef?.badgeResolver?.(node);
  if (resolved) return resolved;

  const badge = node.data?.['badge'];
  if (badge == null) return null;
  return { label: String(badge), tone: statusToTone(node.status) ?? typeDef?.tone };
}

function statusToTone(status?: string): FlowNodeTone | undefined {
  switch (status) {
    case 'success':
    case 'warning':
    case 'danger':
    case 'muted':
      return status;
    case 'selected':
      return 'primary';
    default:
      return undefined;
  }
}

function resolveIconUrl(node: FlowNode, typeDef?: FlowNodeTypeDefinition): string {
  const dataIconUrl = node.data?.['iconUrl'];
  if (typeof dataIconUrl === 'string') return dataIconUrl;

  const icon = typeDef?.icon;
  if (!icon) return '';
  if (icon.startsWith('assets/') || icon.startsWith('/') || icon.startsWith('http')) return icon;
  return '';
}

function resolveIconLabel(node: FlowNode, typeDef?: FlowNodeTypeDefinition): string {
  const iconLabel = node.data?.['iconLabel'];
  if (typeof iconLabel === 'string' && iconLabel.trim()) return iconLabel.trim().slice(0, 2).toUpperCase();
  const label = typeDef?.label ?? node.type;
  return label.slice(0, 2).toUpperCase();
}

function statusToStroke(status?: string): string | null {
  switch (status) {
    case 'success': return 'var(--app-control-success-border, #22c55e)';
    case 'danger': return 'var(--app-control-danger-border, #ef4444)';
    case 'warning': return 'var(--app-control-warn-border, #f97316)';
    case 'muted': return 'var(--app-text-muted, #94a3b8)';
    default: return null;
  }
}

export function createNodeShape(node: FlowNode, typeDef?: FlowNodeTypeDefinition): joint.dia.Element {
  const shape = typeDef?.shape === 'html' || typeDef?.template ? 'html' : (typeDef?.shape ?? 'rectangle');
  const size = node.size ?? typeDef?.defaultSize ?? { width: 200, height: 70 };
  const label = resolveLabel(node, typeDef);
  const subtitle = resolveSubtitle(node, typeDef);
  const strokeColor = statusToStroke(node.status) ?? toneToColor(typeDef?.tone);
  const ports = buildPorts(typeDef);
  const fullLabel = subtitle ? `${label}\n${subtitle}` : label;

  let el: joint.dia.Element;

  switch (shape) {
    case 'diamond': {
      const w = size.width;
      const h = size.height;
      el = new joint.shapes.standard.Path({
        size: { width: w, height: h },
        attrs: {
          body: {
            d: `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`,
            fill: 'var(--app-card-surface, #ffffff)',
            stroke: strokeColor,
            strokeWidth: 1.5,
            magnet: 'passive',
          },
          label: {
            text: fullLabel,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text, #1e293b)',
            pointerEvents: 'none',
          },
        },
        ports,
      });
      break;
    }
    case 'capsule': {
      el = new joint.shapes.standard.Rectangle({
        size,
        attrs: {
          body: {
            rx: size.height / 2,
            ry: size.height / 2,
            fill: 'var(--app-card-surface, #ffffff)',
            stroke: strokeColor,
            strokeWidth: 1.5,
            magnet: 'passive',
          },
          label: {
            text: fullLabel,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text, #1e293b)',
            pointerEvents: 'none',
          },
        },
        ports,
      });
      break;
    }
    case 'note': {
      el = new joint.shapes.standard.Rectangle({
        size,
        attrs: {
          body: {
            rx: 4,
            ry: 4,
            fill: 'var(--app-surface-soft, #f8fafc)',
            stroke: strokeColor,
            strokeWidth: 1,
            strokeDasharray: '4 3',
            magnet: 'passive',
          },
          label: {
            text: fullLabel,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text-muted, #94a3b8)',
            pointerEvents: 'none',
          },
        },
        ports,
      });
      break;
    }
    case 'placeholder': {
      el = new joint.shapes.standard.Rectangle({
        size,
        attrs: {
          body: {
            rx: 8,
            ry: 8,
            fill: 'none',
            stroke: strokeColor,
            strokeWidth: 1,
            strokeDasharray: '6 6',
            magnet: 'passive',
          },
          label: {
            text: fullLabel,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text-muted, #94a3b8)',
            pointerEvents: 'none',
          },
        },
        ports,
      });
      break;
    }
    case 'html': {
      el = new joint.shapes.standard.Rectangle({
        size,
        attrs: {
          body: {
            width: 'calc(w)',
            height: 'calc(h)',
            rx: 8,
            ry: 8,
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0,
            magnet: 'passive',
          },
          label: {
            text: '',
            pointerEvents: 'none',
          },
        },
        ports,
      });
      break;
    }
    case 'custom':
    case 'rectangle':
    default: {
      const iconUrl = resolveIconUrl(node, typeDef);
      const iconLabel = resolveIconLabel(node, typeDef);
      const badge = resolveBadge(node, typeDef);
      el = new FlowCardElement({
        size,
        attrs: {
          root: {
            cursor: node.disabled ? 'not-allowed' : 'grab',
          },
          body: {
            width: 'calc(w)',
            height: 'calc(h)',
            rx: 8,
            ry: 8,
            fill: 'var(--app-card-surface, #ffffff)',
            stroke: strokeColor,
            strokeWidth: 1.5,
            cursor: node.disabled ? 'not-allowed' : 'grab',
          },
          iconCircle: {
            cx: 24,
            cy: 'calc(h/2)',
            r: 14,
            fill: 'var(--app-chart-primary-fill, #eef2ff)',
            stroke: 'none',
            opacity: 1,
            pointerEvents: 'none',
          },
          icon: {
            x: 12,
            y: 'calc(h/2 - 12)',
            width: 24,
            height: 24,
            href: iconUrl,
            opacity: iconUrl ? 1 : 0,
            pointerEvents: 'none',
          },
          iconLabel: {
            text: iconUrl ? '' : iconLabel,
            x: 24,
            y: 'calc(h/2)',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-primary, #7a77ff)',
            pointerEvents: 'none',
          },
          label: {
            text: label,
            x: 48,
            y: subtitle ? 'calc(h/2 - 7)' : 'calc(h/2)',
            textAnchor: 'start',
            textVerticalAnchor: 'middle',
            textWrap: {
              width: badge ? 'calc(w - 116)' : 'calc(w - 64)',
              maxLineCount: 1,
              ellipsis: true,
            },
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text, #1e293b)',
            pointerEvents: 'none',
          },
          subtitle: {
            text: subtitle,
            x: 48,
            y: 'calc(h/2 + 11)',
            textAnchor: 'start',
            textVerticalAnchor: 'middle',
            textWrap: {
              width: badge ? 'calc(w - 116)' : 'calc(w - 64)',
              maxLineCount: 1,
              ellipsis: true,
            },
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            fill: 'var(--app-text-muted, #94a3b8)',
            opacity: subtitle ? 1 : 0,
            pointerEvents: 'none',
          },
          badgeBody: {
            x: 'calc(w - 58)',
            y: 12,
            width: 44,
            height: 20,
            rx: 10,
            ry: 10,
            fill: badge ? toneToColor(badge.tone ?? typeDef?.tone ?? 'muted') : 'transparent',
            opacity: badge ? 0.14 : 0,
            pointerEvents: 'none',
          },
          badgeText: {
            text: badge?.label ?? '',
            x: 'calc(w - 36)',
            y: 22,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            fill: badge ? toneToColor(badge.tone ?? typeDef?.tone ?? 'muted') : 'transparent',
            opacity: badge ? 1 : 0,
            pointerEvents: 'none',
            textWrap: {
              width: 38,
              maxLineCount: 1,
              ellipsis: true,
            },
          },
          menuBody: {
            cx: 'calc(w - 18)',
            cy: 'calc(h/2)',
            r: 11,
            fill: 'var(--app-surface, #f8fafc)',
            stroke: 'var(--app-border-soft, #d8dee8)',
            strokeWidth: 1,
            cursor: 'pointer',
            opacity: 1,
          },
          menuDot1: {
            cx: 'calc(w - 22)',
            cy: 'calc(h/2)',
            r: 1.4,
            fill: 'var(--app-text-muted, #64748b)',
            cursor: 'pointer',
          },
          menuDot2: {
            cx: 'calc(w - 18)',
            cy: 'calc(h/2)',
            r: 1.4,
            fill: 'var(--app-text-muted, #64748b)',
            cursor: 'pointer',
          },
          menuDot3: {
            cx: 'calc(w - 14)',
            cy: 'calc(h/2)',
            r: 1.4,
            fill: 'var(--app-text-muted, #64748b)',
            cursor: 'pointer',
          },
        },
        ports,
      });
      break;
    }
  }

  if (node.position) {
    el.position(node.position.x, node.position.y);
  }

  el.set('originalStroke', strokeColor);
  el.set('originalStrokeWidth', 1.5);
  el.set('flowNodeShape', shape);
  updateNodeShape(el, node, typeDef);

  return el;
}

export function updateNodeShape(el: joint.dia.Element, node: FlowNode, typeDef?: FlowNodeTypeDefinition): void {
  const label = resolveLabel(node, typeDef);
  const subtitle = resolveSubtitle(node, typeDef);
  const badge = resolveBadge(node, typeDef);
  const iconUrl = resolveIconUrl(node, typeDef);
  const iconLabel = resolveIconLabel(node, typeDef);
  const strokeColor = statusToStroke(node.status) ?? toneToColor(typeDef?.tone);
  const shape = (el.get('flowNodeShape') as string | undefined) ?? (typeDef?.shape === 'html' || typeDef?.template ? 'html' : (typeDef?.shape ?? 'rectangle'));

  if (node.size) {
    el.resize(node.size.width, node.size.height);
  }

  if (shape === 'html') {
    el.attr({
      body: {
        stroke: 'transparent',
        strokeWidth: 0,
        opacity: 1,
        pointerEvents: 'none',
      },
      label: {
        text: '',
      },
    });
  } else if (shape === 'rectangle' || shape === 'custom') {
    el.attr({
      body: {
        stroke: strokeColor,
        opacity: node.disabled ? 0.55 : 1,
        cursor: node.disabled ? 'not-allowed' : 'grab',
      },
      icon: {
        href: iconUrl,
        opacity: iconUrl ? 1 : 0,
      },
      iconLabel: {
        text: iconUrl ? '' : iconLabel,
      },
      label: {
        text: label,
        y: subtitle ? 'calc(h/2 - 7)' : 'calc(h/2)',
        textWrap: {
          width: badge ? 'calc(w - 116)' : 'calc(w - 64)',
          maxLineCount: 1,
          ellipsis: true,
        },
      },
      subtitle: {
        text: subtitle,
        opacity: subtitle ? 1 : 0,
        textWrap: {
          width: badge ? 'calc(w - 116)' : 'calc(w - 64)',
          maxLineCount: 1,
          ellipsis: true,
        },
      },
      badgeBody: {
        fill: badge ? toneToColor(badge.tone ?? typeDef?.tone ?? 'muted') : 'transparent',
        opacity: badge ? 0.14 : 0,
      },
      badgeText: {
        text: badge?.label ?? '',
        fill: badge ? toneToColor(badge.tone ?? typeDef?.tone ?? 'muted') : 'transparent',
        opacity: badge ? 1 : 0,
      },
      menuBody: {
        opacity: node.disabled ? 0.55 : 1,
      },
    });
  } else {
    const fullLabel = subtitle ? `${label}\n${subtitle}` : label;
    el.attr('label/text', fullLabel);
    el.attr('body/stroke', strokeColor);
  }

  el.set('originalStroke', strokeColor);
}

export function createEdgeShape(edge: FlowEdge, typeDef?: FlowEdgeTypeDefinition): joint.dia.Link {
  const color = toneToColor(typeDef?.tone ?? 'muted');
  const dashed = typeDef?.dashed ?? false;

  const link = new joint.shapes.standard.Link({
    attrs: {
      line: {
        stroke: color,
        strokeWidth: 2,
        strokeDasharray: dashed ? '4 3' : '',
        targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 z', fill: color },
      },
    },
    labels: edge.label ? [{
      attrs: { text: { text: edge.label, fontSize: 10, fontFamily: 'Inter, sans-serif', fill: 'var(--app-text-muted, #94a3b8)' } },
      position: 0.5,
    }] : [],
    router: { name: 'manhattan', args: { step: 20 } },
    connector: { name: 'rounded', args: { radius: 8 } },
  });
  link.set('originalStroke', color);
  return link;
}
