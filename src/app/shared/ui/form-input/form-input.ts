import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {FormConfig, FormContext, GridWidth} from './models/form-config.model';
import {getColClass} from './utils/form.utils'

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
    console.log(this.engine.model());
    
    this.engine.markAllAsTouched();
    if (!this.engine.valid()) return;
    this.submit.emit(this.engine.model());
  }

  getCol(width?: GridWidth): string {
    return getColClass(width)
  }
  
}
