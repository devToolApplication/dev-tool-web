import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DashboardItem, DashboardTabType } from './dashboard.models';

interface PhotoResponse {
  id: number;
  title: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getDashboardItems(tab: DashboardTabType): Observable<DashboardItem[]> {
    const albumMap: Record<DashboardTabType, number> = {
      'ai-agent': 1,
      'trade-bot': 2,
      'file-storage': 3
    };

    return this.http
      .get<PhotoResponse[]>(`https://jsonplaceholder.typicode.com/photos?albumId=${albumMap[tab]}&_limit=6`)
      .pipe(
        map((items) =>
          items.map((item) => ({
            id: item.id,
            title: item.title,
            description: this.buildDescription(tab, item.id),
            imageUrl: item.url
          }))
        )
      );
  }

  private buildDescription(tab: DashboardTabType, id: number): string {
    if (tab === 'ai-agent') {
      return `AI Agent insight #${id} - theo dõi trạng thái xử lý prompt theo thời gian thực.`;
    }

    if (tab === 'trade-bot') {
      return `Trade Bot strategy #${id} - hiệu suất bot và tín hiệu giao dịch gần nhất.`;
    }

    return `File Storage node #${id} - dung lượng và tình trạng đồng bộ của tài nguyên.`;
  }
}
