import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';

@Component({
  selector: 'app-json-viewer',
  standalone: false,
  templateUrl: './json-viewer.component.html',
  styleUrl: './json-viewer.component.css'
})
export class JsonViewerComponent implements OnChanges {
  @Input() value: unknown = null;
  @Input() collapsed = false;
  @Input() readonly = true;
  @Input() showRawToggle = true;
  @Input() showSearch = true;
  @Input() copyLabel = 'copy';
  @Input() maskSecrets = false;
  @Input() secretKeyPattern: RegExp = /(secret|password|token|api[-_]?key|private[-_]?key)/i;

  readonly rawMode = signal(false);
  readonly collapsedState = signal(false);
  readonly searchQuery = signal('');
  readonly copied = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsed']) {
      this.collapsedState.set(this.collapsed);
    }
  }

  get parsedValue(): unknown {
    if (typeof this.value !== 'string') {
      return this.value;
    }
    const raw = this.value.trim();
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.value;
    }
  }

  get invalid(): boolean {
    if (typeof this.value !== 'string' || !this.value.trim()) {
      return false;
    }
    try {
      JSON.parse(this.value);
      return false;
    } catch {
      return true;
    }
  }

  get displayValue(): string {
    if (this.rawMode() && typeof this.value === 'string' && !this.maskSecrets) {
      return this.value;
    }
    try {
      return JSON.stringify(this.displaySource ?? null, null, 2);
    } catch {
      return String(this.value ?? '');
    }
  }

  get filteredDisplayValue(): string {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.displayValue;
    }
    return this.displayValue
      .split('\n')
      .filter((line) => line.toLowerCase().includes(query))
      .join('\n');
  }

  async copy(): Promise<void> {
    const text = this.displayValue;
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    this.copied.set(true);
    window.setTimeout(() => this.copied.set(false), 1200);
  }

  toggleRaw(): void {
    this.rawMode.update((value) => !value);
  }

  toggleCollapsed(): void {
    this.collapsedState.update((value) => !value);
  }

  private get displaySource(): unknown {
    return this.maskSecrets ? this.maskSecretValues(this.parsedValue) : this.parsedValue;
  }

  private maskSecretValues(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskSecretValues(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = this.secretKeyPattern.test(key) ? '[masked]' : this.maskSecretValues(item);
      return acc;
    }, {});
  }
}
