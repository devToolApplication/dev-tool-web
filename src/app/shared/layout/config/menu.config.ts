import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.admin',
    icon: 'pi pi-shield',
    items: [
      { label: 'layout.menu.dashboard', icon: 'pi pi-home', routerLink: '/admin/dashboard' },
      {
        label: 'layout.menu.aiAgentManagement',
        icon: 'pi pi-sparkles',
        items: [
          { label: 'layout.menu.aiModels', icon: 'pi pi-microchip-ai', routerLink: '/admin/ai-agent/models' },
          {
            label: 'layout.menu.mcpServerManagement',
            icon: 'pi pi-wrench',
            items: [
              { label: 'layout.menu.mcpCategory', icon: 'pi pi-tags', routerLink: '/admin/mcp-tool-config/category' },
              { label: 'layout.menu.mcpTool', icon: 'pi pi-wrench', routerLink: '/admin/mcp-tool-config/tool' }
            ]
          }
        ]
      },
      {
        label: 'layout.menu.systemManagement',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'layout.menu.secretManagement',
            icon: 'pi pi-key',
            items: [
              { label: 'layout.menu.storageSystem', icon: 'pi pi-database', routerLink: '/admin/system-management/storage-secrets' },
              { label: 'layout.menu.aiAgentSystem', icon: 'pi pi-sparkles', routerLink: '/admin/system-management/ai-agent-secrets' },
              { label: 'layout.menu.tradeBotSystem', icon: 'pi pi-chart-line', routerLink: '/admin/system-management/trade-bot-secrets' }
            ]
          },
          {
            label: 'layout.menu.generalConfig',
            icon: 'pi pi-sliders-h',
            items: [
              { label: 'layout.menu.storageSystem', icon: 'pi pi-database', routerLink: '/admin/system-management/storage-configs' },
              { label: 'layout.menu.aiAgentSystem', icon: 'pi pi-sparkles', routerLink: '/admin/system-management/ai-agent-configs' },
              { label: 'layout.menu.tradeBotSystem', icon: 'pi pi-chart-line', routerLink: '/admin/system-management/trade-bot-configs' }
            ]
          },
          {
            label: 'layout.menu.debugTools',
            icon: 'pi pi-bug',
            items: [
              { label: 'layout.menu.checkChatGpt', icon: 'pi pi-comments', routerLink: '/admin/system-management/system-ask' }
            ]
          }
        ]
      },
      {
        label: 'layout.menu.fileStorageManagement',
        icon: 'pi pi-cloud-upload',
        items: [{ label: 'layout.menu.storageRepository', icon: 'pi pi-database', routerLink: '/admin/upload-storage/storage' }]
      },
      {
        label: 'layout.menu.tradeBotManagement',
        icon: 'pi pi-chart-line',
        items: [
          { label: 'layout.menu.dataSource', icon: 'pi pi-database', routerLink: '/admin/trade-bot/data-source' },
          { label: 'Strategy Config', icon: 'pi pi-sliders-h', routerLink: '/admin/trade-bot/strategy-configs' },
          { label: 'Rule Config', icon: 'pi pi-list-check', routerLink: '/admin/trade-bot/rule-configs' },
          { label: 'layout.menu.strategyBinding', icon: 'pi pi-sitemap', routerLink: '/admin/trade-bot/strategy-binding' },
          { label: 'Backtest', icon: 'pi pi-chart-bar', routerLink: '/admin/trade-bot/backtests' }
        ]
      },
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
