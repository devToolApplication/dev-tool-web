import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {FormConfig, FormContext, GridWidth} from './models/form-config.model';

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit{
  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue!: any;
  @Output() submit = new EventEmitter<any>();

  engine: any;

  ngOnInit() {
    this.engine = createFormEngine(
      this.config,
      this.context,
      this.initialValue
    );
  }

  onSubmit() {
    this.engine.markAllAsTouched();
    if (!this.engine.valid()) return;
    this.submit.emit(this.engine.model());
  }

  getColClass(width?: GridWidth): string {
    const map: Record<GridWidth, string> = {
      '1/2': 'col-span-6',
      '1/3': 'col-span-4',
      '1/4': 'col-span-3',
      '1/6': 'col-span-2',
      'full': 'col-span-12'
    };
  
    return map[width ?? 'full'];
  }
  
}
