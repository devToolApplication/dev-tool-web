import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.overview',
    icon: 'pi pi-home',
    groupColor: '#7a77ff',
    items: [
      { label: 'layout.menu.dashboard', icon: 'pi pi-gauge', routerLink: '/admin/dashboard' }
    ]
  },

  {
    label: 'layout.menu.systemConfigs',
    icon: 'pi pi-cog',
    groupColor: '#b37dff',
    items: [
      {
        label: 'layout.menu.tradingConfigs',
        icon: 'pi pi-chart-line',
        items: [
          { label: 'layout.menu.indicatorConfigs', icon: 'pi pi-chart-bar', routerLink: '/admin/trade-bot/indicator-configs' },
          { label: 'layout.menu.ruleConfigs', icon: 'pi pi-sitemap', routerLink: '/admin/trade-bot/rule-configs' },
          { label: 'layout.menu.strategyConfigs', icon: 'pi pi-sliders-h', routerLink: '/admin/trade-bot/strategy-configs' }
        ]
      },
      {
        label: 'layout.menu.aiAgentPlatform',
        icon: 'pi pi-sparkles',
        items: [
          { label: 'layout.menu.aiAgentModels', icon: 'pi pi-server', routerLink: '/admin/system-management/ai-agent-models' },
          { label: 'layout.menu.aiAgentAccounts', icon: 'pi pi-key', routerLink: '/admin/system-management/ai-agent-accounts' },
          { label: 'layout.menu.aiAgentCrawlers', icon: 'pi pi-search', routerLink: '/admin/system-management/ai-agent-crawlers' },
          { label: 'layout.menu.aiAgents', icon: 'pi pi-user', routerLink: '/admin/system-management/ai-agents' }
        ]
      },
      {
        label: 'layout.menu.generalConfigs',
        icon: 'pi pi-sliders-h',
        items: [
          { label: 'layout.menu.jobScheduler', icon: 'pi pi-clock', routerLink: '/admin/job-scheduler' },
          { label: 'layout.menu.dataForms', icon: 'pi pi-file-edit', routerLink: '/admin/data-forms/create', permissions: ['FORM_CONFIG_CREATE'] },
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
      }
    ]
  },
  {
    label: 'layout.menu.serviceManagement',
    icon: 'pi pi-th-large',
    groupColor: '#f97316',
    items: [
      {
        label: 'layout.menu.tradeBotManagement',
        icon: 'pi pi-chart-line',
        items: [
          { label: 'layout.menu.tradingDashboard', icon: 'pi pi-gauge', routerLink: '/admin/trade-bot/dashboard' },
          { label: 'layout.menu.marketData', icon: 'pi pi-database', routerLink: '/admin/trade-bot/market-data' },
          { label: 'layout.menu.backtests', icon: 'pi pi-history', routerLink: '/admin/trade-bot/backtests' },
          { label: 'layout.menu.paperTrade', icon: 'pi pi-wallet', routerLink: '/admin/trade-bot/paper-trade' },
          { label: 'layout.menu.replay', icon: 'pi pi-play-circle', routerLink: '/admin/trade-bot/replay' },
          { label: 'layout.menu.sandbox', icon: 'pi pi-bolt', routerLink: '/admin/trade-bot/sandbox' },
          { label: 'layout.menu.cacheMonitor', icon: 'pi pi-server', routerLink: '/admin/trade-bot/cache-monitor' },
          { label: 'layout.menu.systemLogs', icon: 'pi pi-list-check', routerLink: '/admin/trade-bot/system-logs' }
        ]
      },
      {
        label: 'layout.menu.fileStorageManagement',
        icon: 'pi pi-cloud-upload',
        items: [
          { label: 'layout.menu.storageRepository', icon: 'pi pi-database', routerLink: '/admin/upload-storage/storage' },
          { label: 'layout.menu.uploadedFiles', icon: 'pi pi-file', routerLink: '/admin/upload-storage/files' },
          { label: 'layout.menu.fileUpload', icon: 'pi pi-upload', routerLink: '/admin/system-management/file-upload' }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.aiSystem',
    icon: 'pi pi-microchip-ai',
    groupColor: '#9333ea',
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
