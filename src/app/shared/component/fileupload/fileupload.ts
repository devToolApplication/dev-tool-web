import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileSelectEvent } from 'primeng/fileupload';

@Component({
  selector: 'app-fileupload',
  standalone: false,
  templateUrl: './fileupload.html',
  styleUrl: './fileupload.css'
})
export class Fileupload {
  @Input() mode: 'basic' | 'advanced' = 'basic';
  @Input() chooseLabel = 'Choose';
  @Input() accept?: string;
  @Input() multiple = false;
  @Output() fileSelect = new EventEmitter<FileSelectEvent>();
}
