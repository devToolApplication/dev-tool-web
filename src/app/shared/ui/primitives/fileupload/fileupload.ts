import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface AppFileSelectEvent {
  originalEvent: Event;
  files: File[];
  currentFiles: File[];
}

export interface AppFileUploadHandlerEvent {
  files: File[];
}

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
  @Input() auto = false;
  @Input() disabled = false;
  @Input() maxFileSize?: number;
  @Output() fileSelect = new EventEmitter<AppFileSelectEvent>();
  @Output() uploadHandler = new EventEmitter<AppFileUploadHandlerEvent>();

  selectedFiles: File[] = [];

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const filtered = this.maxFileSize ? files.filter(f => f.size <= this.maxFileSize!) : files;
    this.selectedFiles = this.multiple ? [...this.selectedFiles, ...filtered] : filtered;
    this.fileSelect.emit({ originalEvent: event, files: filtered, currentFiles: this.selectedFiles });
    if (this.auto && this.customUpload) {
      this.upload();
    }
  }

  upload(): void {
    this.uploadHandler.emit({ files: this.selectedFiles });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clear(): void {
    this.selectedFiles = [];
  }
}
