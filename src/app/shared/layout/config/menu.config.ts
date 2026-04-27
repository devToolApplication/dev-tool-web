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
          {
            label: 'Custom Agent',
            icon: 'pi pi-sitemap',
            items: [
              { label: 'Playground', icon: 'pi pi-play-circle', routerLink: '/admin/ai-agent/runtime/playground' },
              { label: 'Agents', icon: 'pi pi-sitemap', routerLink: '/admin/ai-agent/agents' },
              { label: 'layout.menu.aiModels', icon: 'pi pi-microchip-ai', routerLink: '/admin/ai-agent/models' },
              { label: 'Prompt Templates', icon: 'pi pi-file-edit', routerLink: '/admin/ai-agent/prompt-templates' },
              { label: 'Execution Policies', icon: 'pi pi-sliders-h', routerLink: '/admin/ai-agent/execution-policies' },
              { label: 'Execution Traces', icon: 'pi pi-history', routerLink: '/admin/ai-agent/execution-traces' },
              { label: 'Playwright Sessions', icon: 'pi pi-window-maximize', routerLink: '/admin/ai-agent/playwright-sessions' }
            ]
          },
          {
            label: 'Codex Agent',
            icon: 'pi pi-code',
            items: [
              { label: 'Agents', icon: 'pi pi-sitemap', routerLink: '/admin/codex-agent/agents' }
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
              { label: 'layout.menu.checkChatGpt', icon: 'pi pi-comments', routerLink: '/admin/system-management/system-ask' },
              { label: 'layout.menu.fileUpload', icon: 'pi pi-upload', routerLink: '/admin/system-management/file-upload' }
            ]
          }
        ]
      },
      {
        label: 'layout.menu.fileStorageManagement',
        icon: 'pi pi-cloud-upload',
        items: [
          { label: 'layout.menu.storageRepository', icon: 'pi pi-database', routerLink: '/admin/upload-storage/storage' },
          { label: 'Uploaded Files', icon: 'pi pi-file', routerLink: '/admin/upload-storage/files' }
        ]
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
