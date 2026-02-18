import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { MailItem, MailService } from './mail.service';

@Component({
  selector: 'app-mail',
  standalone: false,
  templateUrl: './mail.component.html',
  styleUrl: './mail.component.css'
})
export class MailComponent implements OnInit {
  items: MailItem[] = [];
  model: MailItem = { title: '', content: '' };
  editingId: number | null = null;
  loading = false;

  constructor(private readonly service: MailService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.service.getAll().pipe(finalize(() => (this.loading = false))).subscribe((rows) => {
      this.items = rows;
    });
  }

  submit(): void {
    if (!this.model.title || !this.model.content) {
      return;
    }

    const request$ = this.editingId
      ? this.service.update(this.editingId, this.model)
      : this.service.create(this.model);

    request$.subscribe(() => {
      this.cancelEdit();
      this.loadData();
    });
  }

  startEdit(item: MailItem): void {
    this.editingId = item.id ?? null;
    this.model = { title: item.title, content: item.content };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.model = { title: '', content: '' };
  }

  remove(item: MailItem): void {
    if (!item.id) {
      return;
    }

    this.service.delete(item.id).subscribe(() => this.loadData());
  }
}
