import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/ui-services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
