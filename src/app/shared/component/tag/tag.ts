import { Component, Input } from '@angular/core';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null;

@Component({
  selector: 'app-tag',
  standalone: false,
  templateUrl: './tag.html',
  styleUrl: './tag.css'
})
export class Tag {
  @Input() value: string | null | undefined = '';
  @Input() severity: TagSeverity = null;
  @Input() icon?: string;
  @Input() rounded = false;
  @Input() styleClass?: string;
}
