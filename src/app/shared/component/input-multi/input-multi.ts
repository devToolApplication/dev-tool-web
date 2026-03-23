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
  suggestions: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.model = this.normalizeItems(Array.isArray(this.value) ? this.value : []);
    }
  }

  get items(): string[] {
    return this.model;
  }

  get enableTypeahead(): boolean {
    return this.options.length > 0;
  }

  onModelChange(value: unknown): void {
    if (!Array.isArray(value)) {
      this.debug('ngModelChange ignored', value);
      return;
    }

    const nextItems = this.normalizeItems(value);
    const isRemoval = nextItems.length < this.model.length && nextItems.every((item) => this.model.includes(item));
    const isSame = nextItems.length === this.model.length && nextItems.every((item, index) => item === this.model[index]);

    if (isSame) {
      this.debug('ngModelChange same', this.model);
      return;
    }

    if (isRemoval) {
      this.model = nextItems;
      this.debug('ngModelChange removal sync', this.model);
      this.onChange(this.model);
      return;
    }

    const mergedItems = this.normalizeItems([...this.model, ...nextItems]);
    this.model = mergedItems;
    this.debug('ngModelChange merge sync', { current: this.model, incoming: nextItems });
    this.onChange(this.model);
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    const normalizedQuery = query.trim();
    const keyword = normalizedQuery.toLowerCase();
    const optionSuggestions = this.options
      .map((option) => String(option.value ?? option.label ?? '').trim())
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index)
      .filter((item) => !this.items.includes(item))
      .filter((item) => !keyword || item.toLowerCase().includes(keyword));

    this.suggestions = normalizedQuery && !this.items.includes(normalizedQuery)
      ? [normalizedQuery, ...optionSuggestions.filter((item) => item !== normalizedQuery)]
      : optionSuggestions;
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    this.commitCurrentQuery();
  }

  override onBlur(): void {
    this.commitCurrentQuery();
    super.onBlur();
  }

  onItemSelect(value: unknown): void {
    const item = String(value ?? '').trim();
    if (!item) {
      return;
    }

    this.debug('onSelect', { selected: item, before: this.model });
    this.appendItem(item);
    this.currentQuery = '';
  }

  onItemUnselect(value: unknown): void {
    const item = String(value ?? '').trim();
    if (!item) {
      return;
    }

    this.model = this.model.filter((current) => current !== item);
    this.debug('onUnselect', { removed: item, after: this.model });
    this.onChange(this.model);
  }

  private commitCurrentQuery(): void {
    const value = this.currentQuery.trim();
    if (!value) {
      this.currentQuery = '';
      return;
    }

    this.appendItem(value);
    this.currentQuery = '';
  }

  private appendItem(value: string): void {
    if (this.items.includes(value)) {
      this.debug('append skip duplicate', value);
      return;
    }

    this.model = [...this.items, value];
    this.debug('append item', this.model);
    this.onChange(this.model);
  }

  private normalizeItems(values: unknown[]): string[] {
    return values
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  private debug(message: string, payload: unknown): void {
    console.log('[InputMulti]', message, payload);
  }
}
