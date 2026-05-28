import { AfterViewInit, Component, DestroyRef, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-input-multi',
  standalone: false,
  templateUrl: './input-multi.html',
  styleUrl: './input-multi.css',
  providers: [provideValueAccessor(() => InputMulti)]
})
export class InputMulti extends BaseInput<string[]> implements AfterViewInit, OnChanges {
  @Input() options: SelectOption[] = [];

  currentQuery = '';
  model: string[] = [];
  selectedOptions: SelectOption[] = [];
  suggestions: SelectOption[] = [];

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    const observer = new MutationObserver(() => this.fixAccessibility());
    observer.observe(this.host.nativeElement, { childList: true, subtree: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
    this.fixAccessibility();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.model = this.normalizeItems(Array.isArray(this.value) ? this.value : []);
      this.selectedOptions = this.model.map((item) => this.toOption(item));
      this.syncSuggestions();
    }
  }

  get enableTypeahead(): boolean {
    return this.options.length > 0;
  }

  onModelChange(value: unknown): void {
    if (!Array.isArray(value)) return;

    this.selectedOptions = this.normalizeOptions(value);
    this.model = this.selectedOptions.map((option) => String(option.value));
    this.syncSuggestions();
    this.onChange(this.model);
  }

  onSearch(query: string): void {
    this.currentQuery = query;
    this.syncSuggestions(query);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.commitCurrentQuery();
  }

  override onBlur(): void {
    this.commitCurrentQuery();
    super.onBlur();
  }

  private commitCurrentQuery(): void {
    const value = this.currentQuery.trim();
    if (!value || this.model.includes(value)) {
      this.currentQuery = '';
      this.syncSuggestions();
      return;
    }

    this.model = [...this.model, value];
    this.selectedOptions = [...this.selectedOptions, this.toOption(value)];
    this.onChange(this.model);
    this.currentQuery = '';
    this.syncSuggestions();
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

    const suggestions = [...this.selectedOptions, ...available];
    if (keyword && !suggestions.some((option) => option.value === keyword)) {
      suggestions.unshift(this.toOption(keyword));
    }

    this.suggestions = suggestions.filter(
      (option, index, items) => items.findIndex((item) => item.value === option.value) === index
    );
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

  private fixAccessibility(): void {
    const accessibleName = this.label || this.placeholder || this.inputId;
    const root = this.host.nativeElement as HTMLElement;
    root.querySelectorAll('.p-autocomplete-input-multiple[role="listbox"]')
      .forEach((el) => {
        el.setAttribute('role', 'list');
        el.removeAttribute('aria-orientation');
        el.setAttribute('aria-label', accessibleName);
      });
    root.querySelectorAll('.p-autocomplete-chip-item[role="option"], .p-autocomplete-input-multiple li[role="option"]')
      .forEach((el) => {
        el.setAttribute('role', 'listitem');
        el.removeAttribute('aria-selected');
        el.removeAttribute('aria-setsize');
        el.removeAttribute('aria-posinset');
      });
  }
}
