export type McpToolCategory = string;
export type McpToolType = 'endpoint' | 'db';
export type McpEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type McpDbQueryType = 'select' | 'insert' | 'update' | 'delete';

export interface McpCategoryResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  status?: string;
}

export interface McpCategoryCreateDto {
  name: string;
  code: string;
  description?: string;
  status: string;
}

export interface McpCategoryUpdateDto {
  name?: string;
  code?: string;
  description?: string;
  status?: string;
}

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

export interface McpToolResponse {
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

export interface McpToolCreateDto {
  category: McpToolCategory;
  name: string;
  type: McpToolType;
  enabled: boolean;
  description: string;
  tags: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
}

export interface McpToolUpdateDto {
  category?: McpToolCategory;
  name?: string;
  type?: McpToolType;
  enabled?: boolean;
  description?: string;
  tags?: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
}

export interface McpCollectionField {
  fieldName: string;
  dataTypes: string[];
}
