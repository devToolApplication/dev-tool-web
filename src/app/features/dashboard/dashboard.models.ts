export interface DashboardItem {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

export type DashboardTabType = 'ai-agent' | 'trade-bot' | 'file-storage';
