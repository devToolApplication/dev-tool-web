import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.overview',
    icon: 'pi pi-home',
    items: [
      { label: 'layout.menu.dashboard', icon: 'pi pi-gauge', routerLink: '/admin/dashboard' }
    ]
  },

  {
    label: 'layout.menu.tradeBotManagement',
    icon: 'pi pi-chart-line',
    items: [
      { label: 'layout.menu.tradingDashboard', icon: 'pi pi-gauge', routerLink: '/admin/trade-bot/dashboard' },
      { label: 'layout.menu.marketData', icon: 'pi pi-database', routerLink: '/admin/trade-bot/market-data' },
      { label: 'layout.menu.indicatorConfigs', icon: 'pi pi-chart-bar', routerLink: '/admin/trade-bot/indicator-configs' },
      { label: 'layout.menu.ruleConfigs', icon: 'pi pi-sitemap', routerLink: '/admin/trade-bot/rule-configs' },
      { label: 'layout.menu.strategyConfigs', icon: 'pi pi-sliders-h', routerLink: '/admin/trade-bot/strategy-configs' },
      { label: 'layout.menu.backtests', icon: 'pi pi-history', routerLink: '/admin/trade-bot/backtests' },
      { label: 'layout.menu.paperTrade', icon: 'pi pi-wallet', routerLink: '/admin/trade-bot/paper-trade' },
      {
        label: 'layout.menu.debugTools',
        icon: 'pi pi-bug',
        items: [
          { label: 'layout.menu.replay', icon: 'pi pi-play-circle', routerLink: '/admin/trade-bot/replay' },
          { label: 'layout.menu.sandbox', icon: 'pi pi-bolt', routerLink: '/admin/trade-bot/sandbox' },
          { label: 'layout.menu.cacheMonitor', icon: 'pi pi-server', routerLink: '/admin/trade-bot/cache-monitor' },
          { label: 'layout.menu.systemLogs', icon: 'pi pi-list-check', routerLink: '/admin/trade-bot/system-logs' }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.fileStorageManagement',
    icon: 'pi pi-cloud-upload',
    items: [
      { label: 'layout.menu.storageRepository', icon: 'pi pi-database', routerLink: '/admin/upload-storage/storage' },
      { label: 'layout.menu.uploadedFiles', icon: 'pi pi-file', routerLink: '/admin/upload-storage/files' }
    ]
  },
  {
    label: 'layout.menu.systemManagement',
    icon: 'pi pi-cog',
    items: [
      { label: 'layout.menu.jobScheduler', icon: 'pi pi-clock', routerLink: '/admin/job-scheduler' },
      { label: 'layout.menu.dataForms', icon: 'pi pi-file-edit', routerLink: '/admin/data-forms/create', permissions: ['FORM_CONFIG_CREATE'] },
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
        label: 'layout.menu.secretManagement',
        icon: 'pi pi-key',
        items: [
          { label: 'layout.menu.storageSystem', icon: 'pi pi-database', routerLink: '/admin/system-management/storage-secrets' },
          { label: 'layout.menu.aiAgentSystem', icon: 'pi pi-sparkles', routerLink: '/admin/system-management/ai-agent-secrets' },
          { label: 'layout.menu.tradeBotSystem', icon: 'pi pi-chart-line', routerLink: '/admin/system-management/trade-bot-secrets' }
        ]
      },
      {
        label: 'layout.menu.debugTools',
        icon: 'pi pi-bug',
        items: [
          { label: 'layout.menu.fileUpload', icon: 'pi pi-upload', routerLink: '/admin/system-management/file-upload' }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.aiSystem',
    icon: 'pi pi-microchip-ai',
    hidden: true,
    items: [
      {
        label: 'layout.menu.mcpClient',
        icon: 'pi pi-desktop',
        routerLink: '/ai-system/mcp-client'
      }
    ]
  }
];
