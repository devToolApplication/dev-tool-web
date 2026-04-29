import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-check-box',
  standalone: false,
  templateUrl: './check-box.html',
  styleUrl: './check-box.css',
  providers: [provideValueAccessor(() => CheckBox)]
})
export class CheckBox extends BaseInput<boolean>{

}
