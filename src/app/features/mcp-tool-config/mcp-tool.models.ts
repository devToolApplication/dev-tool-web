export type McpToolCategory = 'jira' | 'github' | 'code' | 'slack' | 'custom';

export interface McpToolConfig {
  id: string;
  category: McpToolCategory;
  name: string;
  endpoint: string;
  authType: 'api_key' | 'oauth' | 'none';
  enabled: boolean;
  timeoutMs: number;
  retryCount: number;
  description: string;
  scopes: string[];
  updatedAt: string;
}

export interface McpToolUpsertPayload {
  category: McpToolCategory;
  name: string;
  endpoint: string;
  authType: 'api_key' | 'oauth' | 'none';
  enabled: boolean;
  timeoutMs: number;
  retryCount: number;
  description: string;
  scopes: string[];
}
