import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'admin',
    icon: 'pi pi-shield',
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/admin/dashboard' },
      {
        label: 'Quan ly he thong',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Khoa bi mat',
            icon: 'pi pi-key',
            items: [
              { label: 'He thong luu tru', icon: 'pi pi-database', routerLink: '/admin/system-management/storage-secrets' },
              { label: 'He thong AI Agent', icon: 'pi pi-sparkles', routerLink: '/admin/system-management/ai-agent-secrets' },
              { label: 'Trade Bot MCRS', icon: 'pi pi-chart-line', routerLink: '/admin/system-management/trade-bot-secrets' }
            ]
          },
          {
            label: 'Cau hinh chung',
            icon: 'pi pi-sliders-h',
            items: [
              { label: 'He thong luu tru', icon: 'pi pi-database', routerLink: '/admin/system-management/storage-configs' },
              { label: 'He thong AI Agent', icon: 'pi pi-sparkles', routerLink: '/admin/system-management/ai-agent-configs' },
              { label: 'Trade Bot MCRS', icon: 'pi pi-chart-line', routerLink: '/admin/system-management/trade-bot-configs' }
            ]
          }
        ]
      },
      {
        label: 'Quan ly luu tru file',
        icon: 'pi pi-cloud-upload',
        items: [{ label: 'Kho luu tru', icon: 'pi pi-database', routerLink: '/admin/upload-storage/storage' }]
      },
      {
        label: 'Quan ly mcp server',
        icon: 'pi pi-wrench',
        items: [
          { label: 'mcp category', icon: 'pi pi-tags', routerLink: '/admin/mcp-tool-config/category' },
          { label: 'mcp tool', icon: 'pi pi-wrench', routerLink: '/admin/mcp-tool-config/tool' }
        ]
      },
      {
        label: 'Quan ly trade bot',
        icon: 'pi pi-chart-line',
        items: [
          { label: 'Nguon du lieu', icon: 'pi pi-database', routerLink: '/admin/trade-bot/data-source' },
          { label: 'Trade Strategy Binding', icon: 'pi pi-sitemap', routerLink: '/admin/trade-bot/strategy-binding' },
          { label: 'Backtest', icon: 'pi pi-chart-bar', routerLink: '/admin/trade-bot/backtests' }
        ]
      },
      { label: 'AI Agent Stream', icon: 'pi pi-sparkles', routerLink: '/admin/ai-agent-stream' }
    ]
  },
  {
    label: 'layout.menu.aiSystem',
    icon: 'pi pi-microchip-ai',
    items: [
      {
        label: 'layout.menu.mcpClient',
        icon: 'pi pi-desktop',
        routerLink: '/ai-system/mcp-client'
      }
    ]
  }
];
