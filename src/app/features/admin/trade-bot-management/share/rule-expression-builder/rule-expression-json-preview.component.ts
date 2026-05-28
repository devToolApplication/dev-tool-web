import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-rule-expression-json-preview',
  standalone: false,
  templateUrl: './rule-expression-json-preview.component.html',
  styleUrl: './rule-expression-builder.component.css'
})
export class RuleExpressionJsonPreviewComponent {
  @Input() value: unknown;

  readonly collapsed = signal(true);

  toggle(): void {
    this.collapsed.update((value) => !value);
  }

  jsonText(): string {
    try {
      return JSON.stringify(this.value ?? null, null, 2);
    } catch {
      return String(this.value ?? '');
    }
  }
}

