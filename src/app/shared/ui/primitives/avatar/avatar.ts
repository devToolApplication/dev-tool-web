import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: false,
  templateUrl: './avatar.html',
  styleUrl: './avatar.css'
})
export class AvatarComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() image?: string;
  @Input() size: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() shape: 'square' | 'circle' = 'circle';
  @Input() styleClass?: string;
}
