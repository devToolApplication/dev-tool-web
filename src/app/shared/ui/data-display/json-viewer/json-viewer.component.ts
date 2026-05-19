import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';

interface JsonSearchResult {
  path: string;
  value: unknown;
  displayValue: string;
}

@Component({
  selector: 'app-json-viewer',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly searchResults = computed(() => this.findSearchResults(this.searchQuery()));

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
    await this.copyText(text);
  }

  async copyPath(result: JsonSearchResult): Promise<void> {
    await this.copyText(result.path);
  }

  async copyValue(result: JsonSearchResult): Promise<void> {
    await this.copyText(this.valueToClipboardText(result.value));
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

  private findSearchResults(query: string): JsonSearchResult[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return this.flattenJson(this.displaySource)
      .filter((result) => `${result.path} ${result.displayValue}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 50);
  }

  private flattenJson(value: unknown, path = '$'): JsonSearchResult[] {
    const current: JsonSearchResult = {
      path,
      value,
      displayValue: this.previewValue(value)
    };

    if (Array.isArray(value)) {
      return [
        current,
        ...value.flatMap((item, index) => this.flattenJson(item, `${path}[${index}]`))
      ];
    }

    if (value && typeof value === 'object') {
      return [
        current,
        ...Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
          this.flattenJson(item, this.childPath(path, key))
        )
      ];
    }

    return [current];
  }

  private childPath(path: string, key: string): string {
    return /^[A-Za-z_$][\w$]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
  }

  private previewValue(value: unknown): string {
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }

    if (value && typeof value === 'object') {
      return `Object(${Object.keys(value as Record<string, unknown>).length})`;
    }

    return String(value ?? '');
  }

  private valueToClipboardText(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value ?? '');
    }
  }

  private async copyText(text: string): Promise<void> {
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
