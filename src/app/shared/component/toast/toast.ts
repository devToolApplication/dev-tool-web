import { Component, Input } from '@angular/core';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {
  @Input() key?: string;
  @Input() position: ToastPosition = 'top-right';
  @Input() baseZIndex = 2100;
  @Input() autoZIndex = true;
  @Input() preventOpenDuplicates = true;
  @Input() preventDuplicates = false;
  @Input() showTransformOptions = 'translateY(100%)';
  @Input() hideTransformOptions = 'translateY(-100%)';
  @Input() showTransitionOptions = '.3s ease-out';
  @Input() hideTransitionOptions = '.2s ease-in';
  @Input() life = 3000;
  @Input() severity?: ToastSeverity;
}
