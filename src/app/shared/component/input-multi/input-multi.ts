import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { AutoComplete } from 'primeng/autocomplete';
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
  @ViewChild(AutoComplete) autoComplete?: AutoComplete;

  currentQuery = '';
  model: string[] = [];
  suggestions: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.model = this.normalizeItems(Array.isArray(this.value) ? this.value : []);
      this.syncAutoCompleteModel();
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
    const isSame = nextItems.length === this.model.length && nextItems.every((item, index) => item === this.model[index]);
    const isSubset = nextItems.length < this.model.length && nextItems.every((item) => this.model.includes(item));

    if (isSame) {
      this.debug('ngModelChange same', this.model);
      return;
    }

    if (isSubset) {
      this.debug('ngModelChange skip subset', { current: this.model, incoming: nextItems });
      this.syncAutoCompleteModel();
      return;
    }

    this.model = nextItems;
    this.debug('ngModelChange sync', this.model);
    this.syncAutoCompleteModel();
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
    this.syncAutoCompleteModel();
  }

  onItemUnselect(value: unknown): void {
    const item = String(value ?? '').trim();
    if (!item) {
      return;
    }

    this.model = this.model.filter((current) => current !== item);
    this.debug('onUnselect', { removed: item, after: this.model });
    this.syncAutoCompleteModel();
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
      this.syncAutoCompleteModel();
      return;
    }

    this.model = [...this.items, value];
    this.debug('append item', this.model);
    this.syncAutoCompleteModel();
    this.onChange(this.model);
  }

  private syncAutoCompleteModel(): void {
    if (!this.autoComplete) {
      return;
    }

    this.autoComplete.value = this.model;
    this.autoComplete.writeModelValue(this.model);
    this.autoComplete.updateInputValue();
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
