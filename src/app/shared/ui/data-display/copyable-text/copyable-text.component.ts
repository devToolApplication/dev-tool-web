import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-copyable-text',
  standalone: false,
  templateUrl: './copyable-text.component.html',
  styleUrl: './copyable-text.component.css'
})
export class CopyableTextComponent {
  @Input() value: unknown = '';
  @Input() shorten = false;
  @Input() maxLength = 24;
  @Input() showCopy = true;
  @Input() allowCopy = true;
  @Input() secret = false;
  @Input() emptyValue = '-';

  @Output() copied = new EventEmitter<string>();

  readonly copiedState = signal(false);

  get text(): string {
    if (this.value == null || this.value === '') {
      return this.emptyValue;
    }
    if (typeof this.value === 'string') {
      return this.value;
    }
    try {
      return JSON.stringify(this.value);
    } catch {
      return String(this.value);
    }
  }

  get displayText(): string {
    const text = this.text;
    if (!this.shorten || text.length <= this.maxLength) {
      return text;
    }
    const edge = Math.max(4, Math.floor((this.maxLength - 3) / 2));
    return `${text.slice(0, edge)}...${text.slice(-edge)}`;
  }

  get canCopy(): boolean {
    return this.showCopy && this.allowCopy && !this.secret && this.text !== this.emptyValue;
  }

  async copy(event?: Event): Promise<void> {
    event?.stopPropagation();
    const text = this.text;
    if (!text || !this.canCopy) {
      return;
    }
    try {
      if (typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        this.fallbackCopy(text);
      }
    } catch {
      this.fallbackCopy(text);
    }
    this.copiedState.set(true);
    this.copied.emit(text);
    window.setTimeout(() => this.copiedState.set(false), 1200);
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
