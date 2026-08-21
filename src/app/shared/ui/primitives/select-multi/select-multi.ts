import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { SelectOption } from '../select/select';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-select-multi',
  standalone: false,
  templateUrl: './select-multi.html',
  styleUrl: './select-multi.css',
  providers: [provideValueAccessor(() => SelectMulti)]
})
export class SelectMulti extends BaseInput<Array<string | number>> {
  @Input() options: SelectOption[] = [];
  @Input() display = 'chip';
  @Input() enableFilter = false;
  @Input() inline = false;
  @Input() maxSelectedLabels: number | null | undefined;
  @Input() selectionLimit: number | null | undefined;
  @Input() loading = false;

  dropdownOpen = false;

  constructor() {
    super();
  }

  get selectedLabels(): string[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return this.value.map(v => {
      const opt = this.options.find(o => o.value === v);
      return opt?.label ?? String(v);
    });
  }

  isSelected(val: string | number | boolean | null): boolean {
    return Array.isArray(this.value) && this.value.includes(val as string | number);
  }

  toggleOption(val: string | number | boolean | null): void {
    const current = Array.isArray(this.value) ? [...this.value] : [];
    const idx = current.indexOf(val as string | number);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(val as string | number);
    }
    this.onChange(current);
  }

  private readonly host = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    if (this.dropdownOpen && target instanceof HTMLElement && !this.host.nativeElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }

  removeItem(label: string): void {
    const opt = this.options.find(o => o.label === label);
    if (opt) this.toggleOption(opt.value);
  }
}
