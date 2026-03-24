import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseInput } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-input-multi',
  standalone: false,
  templateUrl: './input-multi.html',
  styleUrl: './input-multi.css'
})
export class InputMulti extends BaseInput<string[]> implements OnChanges {
  @Input() options: SelectOption[] = [];

  currentQuery = '';
  model: string[] = [];
  selectedOptions: SelectOption[] = [];
  suggestions: SelectOption[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.model = this.normalizeItems(Array.isArray(this.value) ? this.value : []);
      this.selectedOptions = this.model.map((item) => this.toOption(item));
      this.syncSuggestions();
      this.debugLog('ngOnChanges:value', {
        value: this.value,
        model: this.model,
        selectedOptions: this.selectedOptions,
        suggestions: this.suggestions
      });
    }
  }

  get enableTypeahead(): boolean {
    return this.options.length > 0;
  }

  onModelChange(value: unknown): void {
    this.debugLog('ngModelChange:before', { value, model: this.model, currentQuery: this.currentQuery });
    if (!Array.isArray(value)) {
      this.debugLog('ngModelChange:ignored-non-array', { value });
      return;
    }

    this.selectedOptions = this.normalizeOptions(value);
    this.model = this.selectedOptions.map((option) => String(option.value));
    this.syncSuggestions();
    this.debugLog('ngModelChange:after', {
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
    this.onChange(this.model);
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    this.syncSuggestions(query);
    this.debugLog('completeMethod', {
      query,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
  }

  onInputKeydown(event: KeyboardEvent): void {
    this.debugLog('onInputKeydown', {
      key: event.key,
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions
    });
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    this.commitCurrentQuery();
  }

  override onBlur(): void {
    this.debugLog('onBlur:before', {
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
    this.commitCurrentQuery();
    this.debugLog('onBlur:after-commit', {
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
    super.onBlur();
  }

  override onFocus(): void {
    this.debugLog('onFocus', {
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
    super.onFocus();
  }

  onSelectItem(event: unknown): void {
    this.debugLog('onSelect', {
      event,
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
  }

  onUnselectItem(event: unknown): void {
    this.debugLog('onUnselect', {
      event,
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
  }

  private commitCurrentQuery(): void {
    const value = this.currentQuery.trim();
    if (!value || this.model.includes(value)) {
      this.debugLog('commitCurrentQuery:skip', {
        currentQuery: this.currentQuery,
        model: this.model
      });
      this.currentQuery = '';
      this.syncSuggestions();
      return;
    }

    this.model = [...this.model, value];
    this.selectedOptions = [...this.selectedOptions, this.toOption(value)];
    this.debugLog('commitCurrentQuery:add', {
      addedValue: value,
      model: this.model,
      selectedOptions: this.selectedOptions
    });
    this.onChange(this.model);
    this.currentQuery = '';
    this.syncSuggestions();
    this.debugLog('commitCurrentQuery:after', {
      currentQuery: this.currentQuery,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
  }

  private normalizeItems(values: unknown[]): string[] {
    return values
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  private syncSuggestions(query = this.currentQuery): void {
    const normalizedQuery = query.trim();
    const keyword = normalizedQuery.toLowerCase();
    const optionSuggestions = this.options
      .map((option) => this.toOption(String(option.value ?? option.label ?? '').trim()))
      .filter((option) => option.value)
      .filter((option, index, items) => items.findIndex((item) => item.value === option.value) === index)
      .filter((option) => !this.model.includes(String(option.value)))
      .filter((option) => !keyword || option.label.toLowerCase().includes(keyword));

    const suggestions = [...this.selectedOptions, ...optionSuggestions];
    if (normalizedQuery && !suggestions.some((option) => option.value === normalizedQuery)) {
      suggestions.unshift(this.toOption(normalizedQuery));
    }

    this.suggestions = suggestions.filter((option, index, items) => items.findIndex((item) => item.value === option.value) === index);
    this.debugLog('syncSuggestions', {
      query,
      model: this.model,
      selectedOptions: this.selectedOptions,
      suggestions: this.suggestions
    });
  }

  private normalizeOptions(values: unknown[]): SelectOption[] {
    return this.normalizeItems(values.map((item) => this.extractValue(item))).map((item) => this.toOption(item));
  }

  private extractValue(item: unknown): string {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      return String(record['value'] ?? record['label'] ?? '').trim();
    }

    return String(item ?? '').trim();
  }

  private toOption(value: string): SelectOption {
    return { label: value, value };
  }

  private debugLog(eventName: string, payload: Record<string, unknown>): void {
    console.log('[InputMulti]', eventName, payload);
  }
}
