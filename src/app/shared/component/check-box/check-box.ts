import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-check-box',
  standalone: false,
  templateUrl: './check-box.html',
  styleUrl: './check-box.css'
})
export class CheckBox extends BaseInput<boolean>{

}
