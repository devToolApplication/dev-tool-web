import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type McpToolCategory = string;
export type McpToolType = 'endpoint' | 'db';
export type McpEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type McpDbQueryType = 'select' | 'insert' | 'update' | 'delete';
export type ToolExecutorType = 'JAVA_BEAN' | 'HTTP' | 'WORKFLOW' | 'SCRIPT' | 'DB';
export type McpDbMatchMode = 'and' | 'or';
export type McpDbRuleOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'exists';

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
  matchMode?: McpDbMatchMode;
  rules?: McpDbQueryRule[];
  condition: string;
}

export interface McpDbQueryRule {
  field: string;
  operator: McpDbRuleOperator;
  argumentName?: string;
  value?: string;
}

export interface McpToolFunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface McpToolDefinition {
  type: 'function';
  function: McpToolFunctionDefinition;
}

export interface McpToolResponse {
  id: string;
  code?: string;
  category: McpToolCategory;
  name: string;
  type: McpToolType;
  executorType?: ToolExecutorType;
  executorRef?: string;
  endpointUrl?: string;
  authType?: string;
  secretKeyRef?: string;
  timeoutMs?: number;
  enabled: boolean;
  description: string;
  tool?: McpToolDefinition;
  tags: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
  updatedAt: string;
  status?: UploadStorageStatus;
}

export interface McpToolCreateDto {
  code?: string;
  category: McpToolCategory;
  name: string;
  type: McpToolType;
  executorType?: ToolExecutorType;
  executorRef?: string;
  endpointUrl?: string;
  authType?: string;
  secretKeyRef?: string;
  timeoutMs?: number;
  enabled: boolean;
  description: string;
  tool?: McpToolDefinition;
  tags: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
  status?: UploadStorageStatus;
}

export interface McpToolUpdateDto {
  code?: string;
  category?: McpToolCategory;
  name?: string;
  type?: McpToolType;
  executorType?: ToolExecutorType;
  executorRef?: string;
  endpointUrl?: string;
  authType?: string;
  secretKeyRef?: string;
  timeoutMs?: number;
  enabled?: boolean;
  description?: string;
  tool?: McpToolDefinition;
  tags?: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
  status?: UploadStorageStatus;
}

export interface McpCollectionField {
  fieldName: string;
  dataTypes: string[];
}
