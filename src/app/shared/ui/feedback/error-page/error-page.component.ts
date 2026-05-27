import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-page',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css'
})
export class ErrorPageComponent {
  @Input() code = '';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = 'errors.backToDashboard';
  @Input() actionRouterLink: string | any[] = '/admin/dashboard';

  @Output() actionClick = new EventEmitter<void>();
}
