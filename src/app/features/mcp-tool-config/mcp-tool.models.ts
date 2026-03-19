export type McpToolCategory = 'jira' | 'github' | 'code' | 'slack' | 'custom';
export type McpToolType = 'endpoint' | 'db';
export type McpEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type McpDbQueryType = 'select' | 'insert' | 'update' | 'delete';

export interface McpEndpointConfig {
  method: McpEndpointMethod;
  url: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

export interface McpDbConfig {
  queryType: McpDbQueryType;
  databaseName: string;
  collectionName: string;
  fields: string[];
  condition: string;
}

export interface McpToolConfig {
  id: string;
  category: McpToolCategory;
  name: string;
  type: McpToolType;
  enabled: boolean;
  description: string;
  tags: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
  updatedAt: string;
}

export interface McpToolUpsertPayload {
  category: McpToolCategory;
  name: string;
  type: McpToolType;
  enabled: boolean;
  description: string;
  tags: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
}

export interface McpCollectionField {
  fieldName: string;
  dataTypes: string[];
}
