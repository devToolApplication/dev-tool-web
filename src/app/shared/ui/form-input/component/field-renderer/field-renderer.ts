import {Component, Input} from '@angular/core';
import {SharedModule} from '../../../../shared.module';
import {SelectModule} from 'primeng/select';
import {FieldState, GridWidth} from '../../models/form-config.model';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-field-renderer',
  standalone: false,
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.css',
})
export class FieldRenderer {

  @Input({ required: true })
  field!: FieldState;

}
