import { Component } from '@angular/core';
import { DashboardItem, DashboardTabType } from './dashboard.models';

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  activeTab: DashboardTabType = 'ai-agent';
  loading = false;
  items: DashboardItem[] = [];

  readonly metrics: DashboardMetric[] = [
    { label: 'Yêu cầu hôm nay', value: '12,840', change: '+18%' },
    { label: 'Bot đang chạy', value: '27', change: '+4' },
    { label: 'Tỉ lệ thành công', value: '99.2%', change: '+0.7%' },
    { label: 'Dung lượng đã dùng', value: '1.8 TB', change: '+120 GB' }
  ];

  readonly activities = [
    'AI Agent #A-193 vừa deploy prompt v2.4',
    'Trade Bot ETH scalping chốt lời +4.3%',
    'File Storage node eu-central đã đồng bộ xong',
    'Cảnh báo: 2 tác vụ cần xác nhận quyền truy cập'
  ];

  private readonly mockItemsByTab: Record<DashboardTabType, DashboardItem[]> = {
    'ai-agent': [
      this.createItem(1, 'Intent Classifier', 'Xử lý 3.2K prompt/giờ, độ chính xác 97.8%', 'agent'),
      this.createItem(2, 'RAG Assistant', 'Truy xuất dữ liệu nội bộ với độ trễ trung bình 210ms', 'knowledge'),
      this.createItem(3, 'Support Copilot', 'Đề xuất phản hồi tự động cho 62 phiên hỗ trợ', 'support')
    ],
    'trade-bot': [
      this.createItem(4, 'BTC Trend Rider', 'P/L 24h: +2.9%, drawdown 1.1%', 'trade-btc'),
      this.createItem(5, 'ETH Mean Revert', 'P/L 24h: +1.3%, 14 lệnh đã đóng', 'trade-eth'),
      this.createItem(6, 'SOL Breakout', 'P/L 24h: +4.7%, volatility cao', 'trade-sol')
    ],
    'file-storage': [
      this.createItem(7, 'Cluster AP-SG', 'Đã dùng 73%, tốc độ đọc 420MB/s', 'storage-ap'),
      this.createItem(8, 'Cluster EU-DE', 'Đã dùng 48%, replication 3 bản sao', 'storage-eu'),
      this.createItem(9, 'Cluster US-VA', 'Đã dùng 66%, chưa có cảnh báo lỗi', 'storage-us')
    ]
  };

  constructor() {
    this.items = this.mockItemsByTab['ai-agent'];
  }

  onTabChange(value: string | number | undefined): void {
    if (typeof value !== 'string') {
      return;
    }

    const nextTab = value as DashboardTabType;
    this.activeTab = nextTab;
    this.loading = true;

    setTimeout(() => {
      this.items = this.mockItemsByTab[nextTab];
      this.loading = false;
    }, 250);
  }

  private createItem(id: number, title: string, description: string, seed: string): DashboardItem {
    return {
      id,
      title,
      description,
      imageUrl: this.buildMockImage(seed, title)
    };
  }

  private buildMockImage(seed: string, title: string): string {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#2563eb' />
          <stop offset='100%' stop-color='#7c3aed' />
        </linearGradient>
      </defs>
      <rect width='640' height='360' fill='url(#g)' />
      <circle cx='560' cy='80' r='66' fill='rgba(255,255,255,0.15)' />
      <circle cx='96' cy='300' r='90' fill='rgba(255,255,255,0.12)' />
      <text x='32' y='54' fill='white' font-size='22' font-family='Inter,Arial,sans-serif' font-weight='700'>${title}</text>
      <text x='32' y='86' fill='rgba(255,255,255,0.9)' font-size='15' font-family='Inter,Arial,sans-serif'>Mock dashboard card • ${seed}</text>
    </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}
