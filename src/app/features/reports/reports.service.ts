import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface ReportItem {
  id?: number;
  name: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/todos';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ReportItem[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((rows) => rows.slice(0, 20).map((row) => ({ id: row.id, name: row.title, done: row.completed })))
    );
  }

  create(payload: ReportItem): Observable<ReportItem> {
    return this.http.post<any>(this.apiUrl, {
      title: payload.name,
      completed: payload.done,
      userId: 1
    }).pipe(map((row) => ({ id: row.id, name: row.title, done: row.completed })));
  }

  update(id: number, payload: ReportItem): Observable<ReportItem> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, {
      id,
      title: payload.name,
      completed: payload.done,
      userId: 1
    }).pipe(map((row) => ({ id: row.id, name: row.title, done: row.completed })));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
