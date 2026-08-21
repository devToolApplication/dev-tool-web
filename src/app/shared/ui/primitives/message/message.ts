import { Component, Input } from '@angular/core';

export type MessageSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
export type MessageSize = 'small' | 'large';
export type MessageVariant = 'text' | 'outlined' | 'simple';

@Component({
  selector: 'app-message',
  standalone: false,
  templateUrl: './message.html',
  styleUrl: './message.css'
})
export class MessageComponent {
  @Input() text = '';
  @Input() severity: MessageSeverity = 'info';
  @Input() size: MessageSize = 'small';
  @Input() variant: MessageVariant = 'simple';
  @Input() icon?: string;
}
