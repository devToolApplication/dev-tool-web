import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileSelectEvent, FileUploadHandlerEvent } from 'primeng/fileupload';

@Component({
  selector: 'app-fileupload',
  standalone: false,
  templateUrl: './fileupload.html',
  styleUrl: './fileupload.css'
})
export class Fileupload {
  @Input() mode: 'basic' | 'advanced' = 'basic';
  @Input() chooseLabel = 'chooseFile';
  @Input() uploadLabel = 'upload';
  @Input() cancelLabel = 'cancel';
  @Input() accept?: string;
  @Input() multiple = false;
  @Input() customUpload = true;
  @Input() disabled = false;
  @Input() maxFileSize?: number;
  @Output() fileSelect = new EventEmitter<FileSelectEvent>();
  @Output() uploadHandler = new EventEmitter<FileUploadHandlerEvent>();
}
