export const environment = {
  applicationName: 'Hệ thống hỗ trợ dev',
  production: false,
  dangerouslySkipPermissions: true,
  keycloak: {
    enabled: true,
    url: 'https://keycloak.169.58.153.62.nip.io',
    realm: 'develop_tool_realm',
    clientId: 'develop_tool_web',
    service: {
      ai_agent_service: 'ai_agent_service',
      file_service: 'file_service',
      trade_bot_service: 'trade_bot_service',
      bpm_engine_service: 'bpm_engine_service',
    },
  },
  apiUrl: {
    adminAiGenerator: 'http://localhost:31001/ai-agent-mcrs/v1/admin',
    aiGenerator: 'http://localhost:31001/ai-agent-mcrs/v1',
    adminFileServiceUrl: 'http://localhost:31005/file-mcrs/v1/admin',
    tradeBotAdminUrl: 'http://localhost:31002/trade-bot-mcrs/v1/admin',
    tradeBotUrl: 'http://localhost:31002/trade-bot-mcrs/v1',
    jobSchedulerAdminUrl: 'https://api.169.58.153.62.nip.io/job-service/v1/admin',
    bpmEngineAdminUrl: 'https://api.169.58.153.62.nip.io/bpm-engine/v1/admin',
    bpmEngineUrl: 'https://api.169.58.153.62.nip.io/bpm-engine/v1',
  },
  ws: {
    tradeBotWs: 'ws://localhost:31002/trade-bot-mcrs/ws',
    kocWs: 'ws://localhost:31001/ai-agent-mcrs/ws/koc',
  },
};
