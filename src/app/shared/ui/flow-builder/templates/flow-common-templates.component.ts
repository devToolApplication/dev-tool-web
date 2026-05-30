import { Component, Input } from '@angular/core';
import { FlowNode, FlowNodeTone } from '../models';

interface FlowTemplateField {
  key: string;
  label: string;
  value: unknown;
}

@Component({
  selector: 'app-flow-common-templates',
  standalone: false,
  templateUrl: './flow-common-templates.component.html',
  styleUrls: ['./flow-common-templates.component.css'],
})
export class FlowCommonTemplatesComponent {
  @Input() node!: FlowNode;
  @Input() template = '__info';

  title(): string {
    const data = this.node?.data ?? {};
    return String(data['title'] ?? data['name'] ?? data['actionName'] ?? data['triggerType'] ?? this.node?.label ?? this.node?.type ?? '');
  }

  subtitle(): string {
    const data = this.node?.data ?? {};
    return String(data['subtitle'] ?? data['description'] ?? data['model'] ?? data['app'] ?? '');
  }

  statusLabel(): string {
    const data = this.node?.data ?? {};
    return String(data['statusLabel'] ?? data['badge'] ?? this.node?.status ?? '');
  }

  iconClass(): string {
    const data = this.node?.data ?? {};
    return String(data['icon'] ?? '');
  }

  tone(): FlowNodeTone {
    const data = this.node?.data ?? {};
    const raw = data['tone'] ?? this.node?.status ?? 'primary';
    return this.normalizeTone(raw);
  }

  fields(): FlowTemplateField[] {
    const data = this.node?.data ?? {};
    const rawFields = data['fields'];
    if (Array.isArray(rawFields)) {
      return rawFields
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
          const field = item as Record<string, unknown>;
          return {
            key: String(field['key'] ?? index),
            label: String(field['label'] ?? field['key'] ?? ''),
            value: field['value'] ?? '',
          };
        });
    }

    return Object.entries(data)
      .filter(([key, value]) => value != null && !['title', 'name', 'subtitle', 'description', 'tone', 'icon', 'badge', 'statusLabel'].includes(key))
      .slice(0, 3)
      .map(([key, value]) => ({ key, label: key, value }));
  }

  displayValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }

  private normalizeTone(value: unknown): FlowNodeTone {
    if (value === 'primary' || value === 'info' || value === 'success' || value === 'warning' || value === 'danger' || value === 'muted' || value === 'neutral') {
      return value;
    }
    if (value === 'warn') return 'warning';
    return 'primary';
  }
}

