import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-field-block',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-block.html',
  styleUrl: './field-block.css'
})
export class FieldBlockComponent {
  @Input() label?: string;
  @Input() description?: string;
  @Input() helpText?: string;
  @Input() hint?: string;
  @Input() required = false;
  @Input() optional = false;
  @Input() invalid = false;
  @Input() errorMessage?: string;
  @Input() inputId?: string;

  get resolvedHint(): string | undefined {
    return this.hint || this.helpText;
  }

  get describedBy(): string | null {
    if (!this.inputId) return null;
    const parts: string[] = [];
    if (this.description) parts.push(`${this.inputId}-description`);
    if (this.resolvedHint && !this.invalid) parts.push(`${this.inputId}-hint`);
    if (this.invalid && this.errorMessage) parts.push(`${this.inputId}-error`);
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
