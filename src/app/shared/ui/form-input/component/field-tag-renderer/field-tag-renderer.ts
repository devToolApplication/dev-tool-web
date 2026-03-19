import { Component, Input } from '@angular/core';
import { FieldState } from '../../models/form-config.model';

@Component({
  selector: 'app-field-tag-renderer',
  standalone: false,
  templateUrl: './field-tag-renderer.html',
  styleUrl: './field-tag-renderer.css'
})
export class FieldTagRendererComponent {
  @Input({ required: true })
  field!: FieldState;

  draft = '';
  readonly datalistId = `tag-list-${crypto.randomUUID()}`;

  get tags(): string[] {
    const value = this.field.value();
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  get suggestions(): string[] {
    return this.field
      .options()
      .map((option) => String(option.value ?? option.label ?? '').trim())
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index);
  }

  get filteredSuggestions(): string[] {
    const keyword = this.draft.trim().toLowerCase();
    return this.suggestions.filter((item) => {
      if (this.tags.includes(item)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return item.toLowerCase().includes(keyword);
    });
  }

  get showInvalid(): boolean {
    return !this.field.focusing() && this.field.touched() && !!this.field.errors();
  }

  onDraftChange(value: string): void {
    this.draft = value;
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.addTag(this.draft);
  }

  onAddClick(): void {
    this.addTag(this.draft);
  }

  onRemoveTag(tag: string): void {
    this.field.setValue(this.tags.filter((item) => item !== tag));
    this.field.markAsTouched();
  }

  onFocus(): void {
    this.field.markAsFocused();
  }

  onBlur(): void {
    this.field.markAsBlurred();
    this.field.markAsTouched();
  }

  private addTag(rawValue: string): void {
    const value = rawValue.trim();
    if (!value || this.tags.includes(value) || this.field.disabled()) {
      this.draft = '';
      return;
    }

    this.field.setValue([...this.tags, value]);
    this.field.markAsTouched();
    this.draft = '';
  }
}
