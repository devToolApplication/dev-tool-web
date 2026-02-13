export const environment = {
  applicationName: 'Hệ thống hỗ trợ dev',
  production: true,
  keycloak: {
    url: 'https://keycloak.103.77.243.66.nip.io',
    realm: 'develop_tool_realm',
    clientId: 'develop_tool_web',
    service: {
      ai_agent_service: "ai_agent_service",
      file_service: "file_service",
      trade_bot_service: "trade_bot_service",
      bpm_engine_service: "bpm_engine_service"
    }
  },
  apiUrl:{
    adminAiGenerator: 'https://api.103.77.243.66.nip.io/ai-agent-mcrs/v1/admin',
    aiGenerator: 'https://api.103.77.243.66.nip.io/ai-agent-mcrs/v1',
    adminFileServiceUrl: 'https://api.103.77.243.66.nip.io/file-mcrs/v1/admin',
    tradeBotAdminUrl: 'https://api.103.77.243.66.nip.io/trade-bot-mcrs/v1/admin',
    tradeBotUrl: 'https://api.103.77.243.66.nip.io/trade-bot-mcrs/v1',
    bpmEngineAdminUrl: 'https://api.103.77.243.66.nip.io/bpm-engine/v1/admin',
    bpmEngineUrl: 'https://api.103.77.243.66.nip.io/bpm-engine/v1'
  },
  ws: {
    tradeBotWs: 'wss://api.103.77.243.66.nip.io/trade-bot-mcrs/ws'
  }
};
