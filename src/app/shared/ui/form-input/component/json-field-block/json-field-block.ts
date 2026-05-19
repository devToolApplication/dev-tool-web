import { Component, Input, ViewChild, signal } from '@angular/core';
import { InputArea } from '../../../../component/input-area/input-area';
import { FieldState, TextFieldConfig } from '../../models/form-config.model';

@Component({
  selector: 'app-json-field-block',
  standalone: false,
  templateUrl: './json-field-block.html',
  styleUrl: './json-field-block.css'
})
export class JsonFieldBlockComponent {
  @Input({ required: true }) field!: FieldState;
  @Input() textConfig?: TextFieldConfig;
  @Input() submitted = false;
  @Input() readonlyMode = false;

  @ViewChild('editor') private editor?: InputArea;

  readonly localError = signal<string | null>(null);
  readonly copied = signal(false);

  get showInvalid(): boolean {
    return !this.field.focusing() && (this.field.touched() || this.submitted) && !!this.field.errors();
  }

  get firstErrorMessage(): string | undefined {
    const errors = this.field.errors();
    return errors ? Object.values(errors)[0] : undefined;
  }

  get helpText(): string | undefined {
    const config = this.field?.fieldConfig as { helpText?: string; description?: string } | undefined;
    return config?.helpText || config?.description;
  }

  get contentType(): 'text' | 'json' {
    if (this.field.type === 'json') {
      return 'json';
    }
    return this.textConfig?.contentType ?? 'text';
  }

  get rows(): number {
    return this.textConfig?.rows ?? (this.contentType === 'json' ? 10 : 8);
  }

  get maxRows(): number {
    return this.textConfig?.maxRows ?? (this.contentType === 'json' ? 20 : 16);
  }

  get canValidateJson(): boolean {
    return this.contentType === 'json';
  }

  onFocus(): void {
    this.field.focusing.set(true);
    this.field.blurred.set(false);
  }

  onBlur(): void {
    this.field.focusing.set(false);
    this.field.blurred.set(true);
    this.field.touched.set(true);
  }

  onValueChange(value: string | null): void {
    this.localError.set(null);
    this.field.setValue(value ?? '');
  }

  formatJson(): void {
    if (!this.canValidateJson || this.field.disabled()) {
      return;
    }
    const parsed = this.parseJson();
    if (parsed === undefined) {
      return;
    }
    this.field.setValue(JSON.stringify(parsed, null, 2));
    this.field.markAsTouched();
  }

  validateJson(): void {
    if (!this.canValidateJson) {
      return;
    }
    const parsed = this.parseJson();
    if (parsed !== undefined) {
      this.localError.set(null);
      this.field.markAsTouched();
    }
  }

  async copy(): Promise<void> {
    const text = String(this.field.value() ?? '');
    if (!text) {
      return;
    }
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
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }

  expand(): void {
    this.editor?.openZoom();
  }

  private parseJson(): unknown | undefined {
    const text = String(this.field.value() ?? '').trim();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      this.localError.set(this.textConfig?.jsonValidationMessage ?? 'shared.json.invalid');
      this.field.markAsTouched();
      return undefined;
    }
  }
}
