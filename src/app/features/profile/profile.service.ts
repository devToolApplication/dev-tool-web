import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface ProfileItem {
  id?: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ProfileItem[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((rows) => rows.slice(0, 10).map((row) => ({ id: row.id, name: row.name, email: row.email })))
    );
  }

  create(payload: ProfileItem): Observable<ProfileItem> {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((row) => ({ id: row.id, name: row.name, email: row.email }))
    );
  }

  update(id: number, payload: ProfileItem): Observable<ProfileItem> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { ...payload, id }).pipe(
      map((row) => ({ id: row.id, name: row.name, email: row.email }))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
