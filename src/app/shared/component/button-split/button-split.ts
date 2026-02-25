import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-button-split',
  standalone: false,
  templateUrl: './button-split.html',
  styleUrl: './button-split.css'
})
export class ButtonSplit {
  @Input() label = 'shared.buttonSplit.actions';
  @Input() icon = 'pi pi-cog';
  @Input() model: MenuItem[] = [];
  @Output() buttonClick = new EventEmitter<void>();
}
