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
    // adminAiGenerator: 'https://api.103.77.243.66.nip.io/ai-agent-mcrs/v1/admin',
    adminAiGenerator: 'http://127.0.0.1:31001/ai-agent-mcrs/v1/admin',
    // aiGenerator: 'https://api.103.77.243.66.nip.io/ai-agent-mcrs/v1',
    aiGenerator: 'http://127.0.0.1:31001/ai-agent-mcrs/v1',
    adminFileServiceUrl: 'https://api.103.77.243.66.nip.io/file-mcrs/v1/admin',
    // adminFileServiceUrl: 'http://127.0.0.1:31001/file-mcrs/v1/admin',
    tradeBotAdminUrl: 'http://127.0.0.1:31002/trade-bot-mcrs/v1/admin',
    tradeBotUrl: 'http://127.0.0.1:31002/trade-bot-mcrs/v1',
    // bpmEngineAdminUrl: 'http://127.0.0.1:31005/bpm-engine/v1/admin',
    bpmEngineAdminUrl: 'https://api.103.77.243.66.nip.io/bpm-engine/v1/admin',
    // bpmEngineUrl: 'http://127.0.0.1:31005/bpm-engine/v1',
    bpmEngineUrl: 'https://api.103.77.243.66.nip.io/bpm-engine/v1'
  },
  ws: {
    tradeBotWs: 'http://127.0.0.1:31002/trade-bot-mcrs/ws'
  }
};
