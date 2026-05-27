import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class PrimeConfirmDialogComponent {
  @Input() key?: string;
  @Input() header?: string;
  @Input() message?: string;
  @Input() icon?: string;
  @Input() acceptLabel?: string;
  @Input() rejectLabel?: string;
  @Input() acceptButtonStyleClass?: string;
  @Input() rejectButtonStyleClass?: string;
  @Input() appendTo: HTMLElement | 'body' | null = 'body';
  @Input() closable = true;
  @Input() closeOnEscape = true;
  @Input() dismissableMask = true;
  @Input() styleClass?: string;

  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();
}
