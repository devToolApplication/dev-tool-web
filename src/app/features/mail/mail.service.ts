import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface MailItem {
  id?: number;
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class MailService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/posts';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<MailItem[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((rows) => rows.slice(0, 20).map((row) => ({
        id: row.id,
        title: row.title,
        content: row.body
      })))
    );
  }

  create(payload: MailItem): Observable<MailItem> {
    return this.http.post<any>(this.apiUrl, {
      title: payload.title,
      body: payload.content,
      userId: 1
    }).pipe(map((row) => ({ id: row.id, title: row.title, content: row.body })));
  }

  update(id: number, payload: MailItem): Observable<MailItem> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, {
      id,
      title: payload.title,
      body: payload.content,
      userId: 1
    }).pipe(map((row) => ({ id: row.id, title: row.title, content: row.body })));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
