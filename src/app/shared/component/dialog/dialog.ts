import { Component, EventEmitter, Input, Output } from '@angular/core';

type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

@Component({
  selector: 'app-dialog',
  standalone: false,
  templateUrl: './dialog.html',
  styleUrl: './dialog.css'
})
export class DialogComponent {
  @Input() visible = false;
  @Input() header = '';
  @Input() modal = true;
  @Input() appendTo: HTMLElement | 'body' | null = 'body';
  @Input() baseZIndex = 2000;
  @Input() dismissableMask = false;
  @Input() closeOnEscape = true;
  @Input() closable = true;
  @Input() draggable = false;
  @Input() resizable = false;
  @Input() maximizable = false;
  @Input() position: DialogPosition = 'center';
  @Input() styleClass = '';
  @Input() maskStyleClass = '';
  @Input() width?: string;
  @Input() blockScroll = false;
  @Input() contentStyle?: Record<string, string>;
  @Input() ariaLabel?: string;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() hide = new EventEmitter<void>();

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.hide.emit();
  }
}
