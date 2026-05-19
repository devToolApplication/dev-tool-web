import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type SectionPanelVariant = 'default' | 'muted' | 'warning' | 'danger';
export type SectionPanelDensity = 'compact' | 'comfortable';

@Component({
  selector: 'app-section-panel',
  standalone: false,
  templateUrl: './section-panel.component.html',
  styleUrl: './section-panel.component.css'
})
export class SectionPanelComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() collapsible = false;
  @Input() collapsed = false;
  @Input() loading = false;
  @Input() error?: string | null;
  @Input() empty = false;
  @Input() emptyTitle = 'shared.empty.title';
  @Input() emptyDescription?: string;
  @Input() variant: SectionPanelVariant = 'default';
  @Input() density: SectionPanelDensity = 'comfortable';

  @Output() retry = new EventEmitter<void>();

  readonly collapsedState = signal(false);

  ngOnInit(): void {
    this.collapsedState.set(this.collapsed);
  }

  toggle(): void {
    if (this.collapsible) {
      this.collapsedState.update((value) => !value);
    }
  }
}
