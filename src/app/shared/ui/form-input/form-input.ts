import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {FormConfig, FormContext} from './models/form-config.model';

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
}
