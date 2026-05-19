import { Component, Input } from '@angular/core';

export interface DiffViewerRow {
  key: string;
  before: unknown;
  after: unknown;
  state: 'added' | 'removed' | 'changed' | 'same';
}

@Component({
  selector: 'app-diff-viewer',
  standalone: false,
  templateUrl: './diff-viewer.component.html',
  styleUrl: './diff-viewer.component.css'
})
export class DiffViewerComponent {
  @Input() before: unknown = null;
  @Input() after: unknown = null;
  @Input() emptyTitle = 'shared.empty.title';

  get rows(): DiffViewerRow[] {
    const beforeRecord = this.flatten(this.before, '', new WeakSet<object>());
    const afterRecord = this.flatten(this.after, '', new WeakSet<object>());
    const keys = Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])).sort();

    return keys.map((key) => {
      const beforeValue = beforeRecord[key];
      const afterValue = afterRecord[key];
      const hasBefore = Object.prototype.hasOwnProperty.call(beforeRecord, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(afterRecord, key);
      const beforeText = this.stringify(beforeValue);
      const afterText = this.stringify(afterValue);

      return {
        key,
        before: beforeValue,
        after: afterValue,
        state: !hasBefore ? 'added' : !hasAfter ? 'removed' : beforeText !== afterText ? 'changed' : 'same'
      };
    });
  }

  async copySide(side: 'before' | 'after'): Promise<void> {
    const text = this.stringify(side === 'before' ? this.before : this.after);
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  stringify(value: unknown): string {
    if (value == null) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private flatten(value: unknown, prefix = '', seen: WeakSet<object>): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return { [prefix || 'value']: value };
    }

    if (seen.has(value)) {
      return { [prefix || 'value']: '[Circular]' };
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.reduce<Record<string, unknown>>((acc, item, index) => ({
        ...acc,
        ...this.flatten(item, `${prefix}[${index}]`, seen)
      }), {});
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, child]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object') {
        return { ...acc, ...this.flatten(child, nextPrefix, seen) };
      }
      return { ...acc, [nextPrefix]: child };
    }, {});
  }
}
