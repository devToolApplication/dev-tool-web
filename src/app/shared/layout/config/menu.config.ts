import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.overview',
    icon: 'pi pi-home',
    groupColor: '#7a77ff',
    items: [
      {
        label: 'layout.menu.overview',
        icon: 'pi pi-gauge',
        routerLink: '/admin/overview',
        permissions: ['ADMIN_OVERVIEW_READ']
      }
    ]
  },
  {
    label: 'layout.menu.aiAgentPlatform',
    icon: 'pi pi-sparkles',
    groupColor: '#9333ea',
    items: [
      {
        label: 'layout.menu.aiAgentOperations',
        icon: 'pi pi-play-circle',
        permissions: ['AI_AGENT_EXECUTE', 'AI_AGENT_WORKFLOW_WRITE', 'AI_AGENT_WORKFLOW_REVIEW'],
        permissionsMode: 'any',
        items: [
          { label: 'layout.menu.aiAgentExecution', icon: 'pi pi-play', routerLink: '/admin/ai-agent/execution', permissions: ['AI_AGENT_EXECUTE'] },
          { label: 'layout.menu.aiAgentWorkflowBuilder', icon: 'pi pi-sitemap', routerLink: '/admin/ai-agent/workflows', permissions: ['AI_AGENT_WORKFLOW_WRITE'] },
          { label: 'layout.menu.aiAgentWorkflowMonitor', icon: 'pi pi-eye', routerLink: '/admin/ai-agent/workflow-runs', permissions: ['AI_AGENT_WORKFLOW_REVIEW'] }
        ]
      },
      {
        label: 'layout.menu.aiAgentConfigs',
        icon: 'pi pi-cog',
        permissions: ['AI_AGENT_READ', 'AI_AGENT_CONFIG_WRITE', 'AI_AGENT_SECRET_WRITE'],
        permissionsMode: 'any',
        items: [
          { label: 'layout.menu.aiAgents', icon: 'pi pi-user', routerLink: '/admin/ai-agent/agents', permissions: ['AI_AGENT_READ'] },
          { label: 'layout.menu.aiAgentCrawlers', icon: 'pi pi-search', routerLink: '/admin/ai-agent/crawlers', permissions: ['AI_AGENT_READ'] },
          { label: 'layout.menu.aiAgentModels', icon: 'pi pi-server', routerLink: '/admin/ai-agent/models', permissions: ['AI_AGENT_READ'] },
          { label: 'layout.menu.aiAgentAuthProfiles', icon: 'pi pi-shield', routerLink: '/admin/ai-agent/auth-profiles', permissions: ['AI_AGENT_READ'] },
          { label: 'layout.menu.aiAgentAccounts', icon: 'pi pi-key', routerLink: '/admin/ai-agent/accounts', permissions: ['AI_AGENT_READ'] },
          { label: 'layout.menu.aiAgentSystem', icon: 'pi pi-cog', routerLink: '/admin/ai-agent/configs', permissions: ['AI_AGENT_CONFIG_WRITE'] }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.tradeBotManagement',
    icon: 'pi pi-chart-line',
    groupColor: '#f97316',
    items: [
      {
        label: 'layout.menu.tradingOperations',
        icon: 'pi pi-chart-line',
        permissions: ['TRADE_BOT_RUNTIME_OPERATE'],
        permissionsMode: 'any',
        items: [
          { label: 'layout.menu.tradingDashboard', icon: 'pi pi-gauge', routerLink: '/admin/trade-bot/dashboard', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.marketData', icon: 'pi pi-database', routerLink: '/admin/trade-bot/market-data', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.backtests', icon: 'pi pi-history', routerLink: '/admin/trade-bot/backtests', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.paperTrade', icon: 'pi pi-wallet', routerLink: '/admin/trade-bot/paper-trade', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.replay', icon: 'pi pi-play-circle', routerLink: '/admin/trade-bot/replay', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.sandbox', icon: 'pi pi-bolt', routerLink: '/admin/trade-bot/sandbox', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.cacheMonitor', icon: 'pi pi-server', routerLink: '/admin/trade-bot/cache-monitor', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] },
          { label: 'layout.menu.systemLogs', icon: 'pi pi-list-check', routerLink: '/admin/trade-bot/system-logs', permissions: ['TRADE_BOT_RUNTIME_OPERATE'] }
        ]
      },
      {
        label: 'layout.menu.tradingConfigs',
        icon: 'pi pi-cog',
        permissions: ['TRADE_BOT_READ', 'TRADE_BOT_CONFIG_WRITE', 'TRADE_BOT_SECRET_WRITE'],
        permissionsMode: 'any',
        items: [
          { label: 'layout.menu.indicatorConfigs', icon: 'pi pi-chart-bar', routerLink: '/admin/trade-bot/indicator-configs', permissions: ['TRADE_BOT_READ'] },
          { label: 'layout.menu.ruleConfigs', icon: 'pi pi-sitemap', routerLink: '/admin/trade-bot/rule-configs', permissions: ['TRADE_BOT_READ'] },
          { label: 'layout.menu.strategyConfigs', icon: 'pi pi-sliders-h', routerLink: '/admin/trade-bot/strategy-configs', permissions: ['TRADE_BOT_READ'] },
          { label: 'layout.menu.tradeBotSystem', icon: 'pi pi-cog', routerLink: '/admin/trade-bot/configs', permissions: ['TRADE_BOT_CONFIG_WRITE'] }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.fileStorageManagement',
    icon: 'pi pi-cloud-upload',
    groupColor: '#0ea5e9',
    items: [
      { label: 'layout.menu.storageRepository', icon: 'pi pi-database', routerLink: '/admin/file-storage/repositories', permissions: ['FILE_STORAGE_READ'] },
      { label: 'layout.menu.uploadedFiles', icon: 'pi pi-file', routerLink: '/admin/file-storage/files', permissions: ['FILE_STORAGE_READ'] },
      { label: 'layout.menu.storageSystem', icon: 'pi pi-cog', routerLink: '/admin/file-storage/configs', permissions: ['FILE_STORAGE_CONFIG_WRITE'] }
    ]
  },
  {
    label: 'layout.menu.jobScheduler',
    icon: 'pi pi-clock',
    groupColor: '#22c55e',
    items: [
      { label: 'layout.menu.jobConfigs', icon: 'pi pi-clock', routerLink: '/admin/jobs', permissions: ['JOB_SCHEDULER_READ'] }
    ]
  },
  {
    label: 'layout.menu.dataForms',
    icon: 'pi pi-file-edit',
    groupColor: '#14b8a6',
    items: [
      { label: 'layout.menu.dataForms', icon: 'pi pi-file-edit', routerLink: '/admin/data-forms', permissions: ['DATA_FORM_READ'] }
    ]
  },
  {
    label: 'layout.menu.systemManagement',
    icon: 'pi pi-cog',
    groupColor: '#3b82f6',
    items: [
      {
        label: 'layout.menu.secretManagement',
        icon: 'pi pi-lock',
        routerLink: '/admin/system/secrets',
        permissions: ['AI_AGENT_SECRET_WRITE', 'TRADE_BOT_SECRET_WRITE', 'FILE_STORAGE_SECRET_WRITE', 'JOB_SCHEDULER_READ'],
        permissionsMode: 'any'
      }
    ]
  },
  {
    label: 'layout.menu.devtools',
    icon: 'pi pi-wrench',
    groupColor: '#64748b',
    items: [
      { label: 'layout.menu.fileUpload', icon: 'pi pi-upload', routerLink: '/admin/devtools/file-upload', permissions: ['DEVTOOLS_OPERATE'] },
      { label: 'layout.menu.tokenCache', icon: 'pi pi-sync', routerLink: '/admin/devtools/token-cache', permissions: ['DEVTOOLS_OPERATE'] }
    ]
  }
];
