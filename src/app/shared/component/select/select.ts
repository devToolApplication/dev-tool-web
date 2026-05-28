import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

export type SelectValue = string | number | boolean | null;

export interface SelectOption {
  label: string;
  value: SelectValue;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  value?: SelectValue;
  disabled?: boolean;
  items: SelectOption[];
}

export type SelectOptions = SelectOption[] | SelectOptionGroup[];

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrls: ['./select.css'],
  providers: [provideValueAccessor(() => Select)]
})
export class Select extends BaseInput<SelectValue> {
  @Input() options: SelectOptions | null = [];

  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  @Input() optionDisabled = 'disabled';
  @Input() group = false;
  @Input() optionGroupLabel = 'label';
  @Input() optionGroupChildren = 'items';

  @Input() loading = false;
  @Input() showClear = false;

  dropdownOpen = false;
  private readonly host = inject(ElementRef);

  constructor() {
    super();
  }

  get selectedLabel(): string {
    if (this.value == null || this.value === '') return '';
    if (!this.group) {
      const opt = (this.options as SelectOption[] | null)?.find(o => o.value === this.value);
      return opt?.label ?? String(this.value);
    }
    const groups = (this.options as SelectOptionGroup[] | null) ?? [];
    for (const grp of groups) {
      const opt = grp.items.find(o => o.value === this.value);
      if (opt) return opt.label;
    }
    return String(this.value);
  }

  selectOption(value: SelectValue): void {
    this.onChange(value);
    this.dropdownOpen = false;
    this.onSelect();
  }

  onBlurDelay(): void {
    setTimeout(() => this.onBlur(), 150);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    if (this.dropdownOpen && target instanceof HTMLElement && !this.host.nativeElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }
}
