import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-auto-complete',
  standalone: false,
  templateUrl: './auto-complete.html',
  styleUrl: './auto-complete.css',
  providers: [provideValueAccessor(() => AutoComplete)]
})
export class AutoComplete extends BaseInput<string> {
  @Input() options: SelectOption[] = [];
  @Output() enterPress = new EventEmitter<void>();

  suggestions: string[] = [];

  get enableTypeahead(): boolean {
    return this.options.length > 0;
  }

  onSearch(query: string): void {
    const normalizedQuery = query.trim();
    const keyword = normalizedQuery.toLowerCase();
    const optionSuggestions = this.options
      .map((option) => String(option.value ?? option.label ?? '').trim())
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index)
      .filter((item) => !keyword || item.toLowerCase().includes(keyword));

    this.suggestions = normalizedQuery
      ? [normalizedQuery, ...optionSuggestions.filter((item) => item !== normalizedQuery)]
      : optionSuggestions;
  }

  onInput(value: string): void {
    this.onChange(value ?? '');
    this.onSearch(value);
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.enterPress.emit();
  }
}
