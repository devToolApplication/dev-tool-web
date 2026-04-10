import { McpCategoryCreateDto, McpToolCreateDto } from '../../../core/models/mcp-server/mcp-tool.model';

export const MCP_TOOL_CONFIG_ROUTES = {
  categoryList: '/admin/mcp-tool-config/category',
  toolList: '/admin/mcp-tool-config/tool'
} as const;

export const MCP_CATEGORY_INITIAL_VALUE: McpCategoryCreateDto = {
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE'
};

export const MCP_TOOL_INITIAL_VALUE: McpToolCreateDto = {
  code: '',
  category: 'custom',
  name: '',
  type: 'endpoint',
  executorType: 'HTTP',
  executorRef: '',
  endpointUrl: '',
  authType: '',
  secretKeyRef: '',
  timeoutMs: 10000,
  enabled: true,
  description: '',
  tool: {
    type: 'function',
    function: {
      name: '',
      description: '',
      parameters: {}
    }
  },
  tags: ['search'],
  endpoint: {
    method: 'GET',
    url: '',
    params: {},
    headers: {},
    body: ''
  },
  db: {
    queryType: 'select',
    databaseName: '',
    collectionName: '',
    fields: [],
    matchMode: 'and',
    rules: [],
    condition: ''
  },
  status: 'ACTIVE'
};
