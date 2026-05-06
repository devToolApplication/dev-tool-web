import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface AppTabItem {
  label: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: false,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.css'
})
export class TabsComponent {
  @Input() tabs: AppTabItem[] = [];
  @Input() value = '';

  @Output() valueChange = new EventEmitter<string>();
}
