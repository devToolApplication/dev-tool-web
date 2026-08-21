import { Component, Input, signal } from '@angular/core';

export interface FieldGuideFieldItem {
  key: string;
  label: string;
  description: string;
}

export interface FieldGuideOptionItem {
  title: string;
  description: string;
}

export interface FieldGuideSection {
  title: string;
  description?: string;
  fields?: FieldGuideFieldItem[];
  examples?: FieldGuideOptionItem[];
  warnings?: FieldGuideOptionItem[];
}

@Component({
  selector: 'app-field-guide-panel',
  standalone: false,
  templateUrl: './field-guide-panel.component.html'
})
export class FieldGuidePanelComponent {
  @Input() title = 'fieldOptions';
  @Input() description = '';
  @Input() fields: FieldGuideFieldItem[] = [];
  @Input() selections: FieldGuideOptionItem[] = [];
  @Input() sections: FieldGuideSection[] = [];
  @Input() examples: FieldGuideOptionItem[] = [];
  @Input() warnings: FieldGuideOptionItem[] = [];
  @Input() collapsible = true;

  readonly collapsed = signal(false);
  readonly copiedKey = signal<string | null>(null);

  get hasBody(): boolean {
    return !!this.description || !!this.fields.length || !!this.selections.length || !!this.sections.length || !!this.examples.length || !!this.warnings.length;
  }

  toggleCollapsed(): void {
    if (this.collapsible) {
      this.collapsed.update((value) => !value);
    }
  }

  async copyExample(item: FieldGuideOptionItem): Promise<void> {
    const text = `${item.title}\n${item.description}`;
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
    this.copiedKey.set(item.title);
  }
}
