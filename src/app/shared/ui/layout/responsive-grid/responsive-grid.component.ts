import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type ResponsiveGridColumns = 1 | 2 | 3 | 4 | 6;
export type ResponsiveGridGap = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-responsive-grid',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
  styleUrl: './responsive-grid.component.css'
})
export class ResponsiveGridComponent {
  @Input() columns: ResponsiveGridColumns = 2;
  @Input() gap: ResponsiveGridGap = 'md';
  @Input() align: 'start' | 'stretch' = 'stretch';

  @HostBinding('class')
  get hostClasses(): string {
    return `responsive-grid responsive-grid--${this.columns} responsive-grid--${this.gap} responsive-grid--${this.align}`;
  }
}
