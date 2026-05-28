import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-input-multi',
  standalone: false,
  templateUrl: './input-multi.html',
  styleUrl: './input-multi.css',
  providers: [provideValueAccessor(() => InputMulti)]
})
export class InputMulti extends BaseInput<string[]> implements OnChanges {
  @Input() options: SelectOption[] = [];

  currentQuery = '';
  model: string[] = [];
  selectedOptions: SelectOption[] = [];
  suggestions: SelectOption[] = [];
  suggestionsOpen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.model = this.normalizeItems(Array.isArray(this.value) ? this.value : []);
      this.selectedOptions = this.model.map((item) => this.toOption(item));
      this.syncSuggestions();
    }
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    this.syncSuggestions(query);
    this.suggestionsOpen = this.suggestions.length > 0;
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.commitCurrentQuery();
  }

  override onBlur(): void {
    setTimeout(() => { this.suggestionsOpen = false; }, 150);
    this.commitCurrentQuery();
    super.onBlur();
  }

  override onFocus(): void {
    super.onFocus();
  }

  addTag(value: unknown): void {
    const str = String(value ?? '').trim();
    if (!str || this.model.includes(str)) return;
    this.model = [...this.model, str];
    this.selectedOptions = this.model.map((item) => this.toOption(item));
    this.onChange(this.model);
    this.currentQuery = '';
    this.syncSuggestions();
  }

  removeTag(value: unknown): void {
    const str = String(value ?? '').trim();
    this.model = this.model.filter((item) => item !== str);
    this.selectedOptions = this.model.map((item) => this.toOption(item));
    this.onChange(this.model);
    this.syncSuggestions();
  }

  isInModel(value: unknown): boolean {
    return this.model.includes(String(value ?? ''));
  }

  private commitCurrentQuery(): void {
    const value = this.currentQuery.trim();
    if (!value || this.model.includes(value)) {
      this.currentQuery = '';
      this.syncSuggestions();
      return;
    }
    this.addTag(value);
  }

  private normalizeItems(values: unknown[]): string[] {
    return values
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  private syncSuggestions(query = this.currentQuery): void {
    const keyword = query.trim().toLowerCase();
    const available = this.options
      .map((option) => this.toOption(String(option.value ?? option.label ?? '').trim()))
      .filter((option) => option.value)
      .filter((option, index, items) => items.findIndex((item) => item.value === option.value) === index)
      .filter((option) => !this.model.includes(String(option.value)))
      .filter((option) => !keyword || option.label.toLowerCase().includes(keyword));

    this.suggestions = available;
    if (keyword && !this.suggestions.some((option) => option.value === keyword)) {
      this.suggestions.unshift(this.toOption(keyword));
    }
  }

  private toOption(value: string): SelectOption {
    const existing = this.options.find((o) => String(o.value) === value);
    return existing ?? { label: value, value };
  }
}
