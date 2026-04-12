import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type McpToolCategory = string;
export type McpToolType = 'endpoint' | 'db';
export type McpEndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
  databaseName: string;
  collectionName: string;
  mongodbQuery: string;
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
  enabled?: boolean;
  description?: string;
  tool?: McpToolDefinition;
  tags?: string[];
  endpoint?: McpEndpointConfig;
  db?: McpDbConfig;
  status?: UploadStorageStatus;
}
