import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-slider',
  standalone: false,
  templateUrl: './slider.html',
  styleUrl: './slider.css'
})
export class SliderComponent {
  @Input() min = 0;
  @Input() max = 100;
  @Input() value: number | null = null;
  @Input() ariaLabel?: string;
  @Input() styleClass?: string;

  @Output() readonly valueChange = new EventEmitter<number | null>();

  onValueChange(value: number | undefined): void {
    this.valueChange.emit(typeof value === 'number' ? value : null);
  }
}
