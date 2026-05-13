import { Component, effect, EventEmitter, Injector, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {FormConfig, FormContext, GridWidth} from './models/form-config.model';
import { getColClass } from './utils/form.utils';

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit, OnChanges {
  private suppressValueChange = true;
  private readonly engineRevision = signal(0);

  constructor(private readonly injector: Injector) {}

  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue!: any;
  @Input() submitting = false;
  @Input() showSubmit = true;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();

  engine: any;

  ngOnInit() {
    this.rebuildEngine();

    effect(() => {
      this.engineRevision();
      if (!this.engine) {
        return;
      }
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

    if (changes['config']?.currentValue) {
      this.rebuildEngine();
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

  markAllAsTouched(): void {
    this.engine?.markAllAsTouched();
  }

  isValid(): boolean {
    return Boolean(this.engine?.valid?.());
  }

  getModel<TModel = any>(): TModel {
    return this.engine?.model?.() as TModel;
  }

  getCol(width?: GridWidth): string {
    return getColClass(width);
  }

  private rebuildEngine(): void {
    this.suppressValueChange = true;
    this.engine = createFormEngine(this.config, this.context, this.initialValue);
    this.engineRevision.update((revision) => revision + 1);
  }
}
