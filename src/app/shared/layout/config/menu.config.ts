import { AppMenuItem } from '../side-menu/side-menu.component';

export const APP_LAYOUT_MENU: AppMenuItem[] = [
  {
    label: 'layout.menu.admin',
    icon: 'pi pi-shield',
    items: [
      { label: 'layout.menu.dashboard', icon: 'pi pi-home', routerLink: '/admin/dashboard' },
      { label: 'layout.menu.uploadStorage', icon: 'pi pi-cloud-upload', routerLink: '/admin/upload-storage/storage' },
      { label: 'layout.menu.aiAgentStream', icon: 'pi pi-sparkles', routerLink: '/admin/ai-agent-stream' },
      { label: 'layout.menu.mcpToolConfig', icon: 'pi pi-wrench', routerLink: '/admin/mcp-tool-config/tool' },
      {
        label: 'layout.menu.componentDemo',
        icon: 'pi pi-box',
        items: [
          { label: 'layout.menu.inputText', icon: 'pi pi-pencil', routerLink: '/admin/component-demo/input-text' },
          { label: 'layout.menu.inputArea', icon: 'pi pi-align-left', routerLink: '/admin/component-demo/input-area' },
          { label: 'layout.menu.inputNumber', icon: 'pi pi-hashtag', routerLink: '/admin/component-demo/input-number' },
          { label: 'layout.menu.password', icon: 'pi pi-key', routerLink: '/admin/component-demo/password' },
          { label: 'layout.menu.checkbox', icon: 'pi pi-check-square', routerLink: '/admin/component-demo/check-box' },
          { label: 'layout.menu.radioButton', icon: 'pi pi-circle', routerLink: '/admin/component-demo/radio-button' },
          { label: 'layout.menu.datePicker', icon: 'pi pi-calendar', routerLink: '/admin/component-demo/date-picker' },
          { label: 'layout.menu.select', icon: 'pi pi-list', routerLink: '/admin/component-demo/select' },
          { label: 'layout.menu.selectMulti', icon: 'pi pi-list-check', routerLink: '/admin/component-demo/select-multi' },
          { label: 'layout.menu.selectTree', icon: 'pi pi-sitemap', routerLink: '/admin/component-demo/select-tree' },
          { label: 'layout.menu.selectButton', icon: 'pi pi-sliders-h', routerLink: '/admin/component-demo/select-button' },
          { label: 'layout.menu.toggleButton', icon: 'pi pi-check-circle', routerLink: '/admin/component-demo/toggle-button' },
          { label: 'layout.menu.toggleSwitch', icon: 'pi pi-power-off', routerLink: '/admin/component-demo/toggle-switch' },
          { label: 'layout.menu.button', icon: 'pi pi-stop', routerLink: '/admin/component-demo/button' },
          { label: 'layout.menu.buttonSplit', icon: 'pi pi-angle-double-down', routerLink: '/admin/component-demo/button-split' },
          { label: 'layout.menu.buttonSpeedDial', icon: 'pi pi-send', routerLink: '/admin/component-demo/button-speed-dial' },
          { label: 'layout.menu.breadcrumb', icon: 'pi pi-angle-right', routerLink: '/admin/component-demo/breadcrumb' },
          { label: 'layout.menu.paginator', icon: 'pi pi-ellipsis-h', routerLink: '/admin/component-demo/paginator' },
          { label: 'layout.menu.fileUpload', icon: 'pi pi-upload', routerLink: '/admin/component-demo/fileupload' },
          { label: 'layout.menu.candleChart', icon: 'pi pi-chart-line', routerLink: '/admin/component-demo/candle-chart' }
        ]
      },
      { label: 'layout.menu.permissionsDemo', icon: 'pi pi-lock', routerLink: '/403' },
      { label: 'layout.menu.missingPageDemo', icon: 'pi pi-exclamation-triangle', routerLink: '/404' },
      {
        label: 'layout.menu.operations',
        icon: 'pi pi-briefcase',
        items: [
          { label: 'layout.menu.queueMonitor', icon: 'pi pi-list-check', routerLink: '/reports' },
          { label: 'layout.menu.scheduler', icon: 'pi pi-calendar-clock', routerLink: '/reports' },
          { label: 'layout.menu.workerNodes', icon: 'pi pi-server', routerLink: '/reports' },
          { label: 'layout.menu.exchangeConnectors', icon: 'pi pi-sitemap', routerLink: '/reports' },
          { label: 'layout.menu.alertRules', icon: 'pi pi-bell', routerLink: '/reports' },
          { label: 'layout.menu.webhookLogs', icon: 'pi pi-history', routerLink: '/reports' },
          { label: 'layout.menu.apiKeys', icon: 'pi pi-key', routerLink: '/reports' },
          { label: 'layout.menu.systemAudit', icon: 'pi pi-book', routerLink: '/reports' },
          { label: 'layout.menu.backups', icon: 'pi pi-database', routerLink: '/reports' },
          { label: 'layout.menu.incidentTimeline', icon: 'pi pi-clock', routerLink: '/reports' },
          { label: 'layout.menu.regionApac', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'layout.menu.regionEu', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'layout.menu.regionUs', icon: 'pi pi-globe', routerLink: '/reports' },
          { label: 'layout.menu.clusterAlpha', icon: 'pi pi-microchip-ai', routerLink: '/reports' },
          { label: 'layout.menu.clusterBeta', icon: 'pi pi-microchip-ai', routerLink: '/reports' },
          { label: 'layout.menu.clusterGamma', icon: 'pi pi-microchip-ai', routerLink: '/reports' }
        ]
      }
    ]
  },
  {
    label: 'layout.menu.mail',
    icon: 'pi pi-envelope',
    badge: '5',
    items: [
      { label: 'layout.menu.compose', icon: 'pi pi-file-edit', shortcut: '⌘+N', routerLink: '/mail/compose' },
      { label: 'layout.menu.inbox', icon: 'pi pi-inbox', badge: '5', routerLink: '/mail/inbox' }
    ]
  },
  {
    label: 'layout.menu.reports',
    icon: 'pi pi-chart-bar',
    shortcut: '⌘+R',
    items: [
      { label: 'layout.menu.sales', icon: 'pi pi-chart-line', badge: '3', routerLink: '/reports' },
      {
        label: 'layout.menu.analytics',
        icon: 'pi pi-chart-scatter',
        items: [
          { label: 'layout.menu.overview', icon: 'pi pi-chart-line', routerLink: '/reports' },
          { label: 'layout.menu.traffic', icon: 'pi pi-compass', routerLink: '/reports' }
        ]
      },
      { label: 'layout.menu.products', icon: 'pi pi-list', badge: '6', routerLink: '/reports' }
    ]
  },
  {
    label: 'layout.menu.profile',
    icon: 'pi pi-user',
    shortcut: '⌘+W',
    items: [
      { label: 'layout.menu.profileSettings', icon: 'pi pi-cog', shortcut: '⌘+O', routerLink: '/settings' },
      { label: 'layout.menu.privacy', icon: 'pi pi-shield', shortcut: '⌘+P', routerLink: '/profile' }
    ]
  }
];
