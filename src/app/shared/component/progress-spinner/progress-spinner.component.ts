import { AfterViewChecked, Component, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-progress-spinner',
  standalone: false,
  templateUrl: './progress-spinner.component.html'
})
export class ProgressSpinnerComponent implements AfterViewChecked {
  @Input() strokeWidth = '4';
  @Input() styleClass?: string;
  @Input() ariaLabel = 'loading';

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewChecked(): void {
    const progressbar = this.host.nativeElement.querySelector<HTMLElement>('[role="progressbar"]');
    if (!progressbar) {
      return;
    }
    progressbar.setAttribute('aria-label', this.ariaLabel || 'loading');
    progressbar.setAttribute('title', this.ariaLabel || 'loading');
  }
}
