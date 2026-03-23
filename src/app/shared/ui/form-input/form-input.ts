import {Component, effect, EventEmitter, inject, Injector, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {FormConfig, FormContext, GridWidth} from './models/form-config.model';
import {getColClass} from './utils/form.utils'

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit, OnChanges {
  private readonly injector = inject(Injector);
  private suppressValueChange = true;
  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue!: any;
  @Input() submitting = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();

  engine: any;

  ngOnInit() {
    this.engine = createFormEngine(
      this.config,
      this.context,
      this.initialValue
    );

    effect(() => {
      const model = this.engine.model();
      if (this.suppressValueChange) {
        this.suppressValueChange = false;
        return;
      }

      this.valueChange.emit(model);
    }, { injector: this.injector });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.engine) {
      return;
    }

    if (changes['context']?.currentValue) {
      this.engine.context.set(this.context);
    }

    if (changes['initialValue']?.currentValue) {
      this.suppressValueChange = true;
      this.engine.reset(this.initialValue);
    }
  }

  onSubmit() {
    if (this.submitting) {
      return;
    }

    this.engine.markAllAsTouched();
    if (!this.engine.valid()) return;
    this.formSubmit.emit(this.engine.model());
  }

  getCol(width?: GridWidth): string {
    return getColClass(width)
  }

}
